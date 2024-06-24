package com.reactnativemediapipe.facelandmarkdetection

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.facebook.react.common.annotations.VisibleForTesting
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.ImageProcessingOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.mrousavy.camera.core.types.Orientation
import com.reactnativemediapipe.shared.orientationToDegrees

class FaceLandmarkDetectorHelper(
  var minFaceDetectionConfidence: Float = DEFAULT_FACE_DETECTION_CONFIDENCE,
  var minFaceTrackingConfidence: Float = DEFAULT_FACE_TRACKING_CONFIDENCE,
  var minFacePresenceConfidence: Float = DEFAULT_FACE_PRESENCE_CONFIDENCE,
  var maxNumFaces: Int = DEFAULT_NUM_FACES,
  var currentDelegate: Int = DELEGATE_CPU,
  var currentModel: String,
  var runningMode: RunningMode = RunningMode.IMAGE,
  val context: Context,
  // this listener is only used when running in RunningMode.LIVE_STREAM
  var faceLandmarkDetectorListener: DetectorListener? = null
) {

  // For this example this needs to be a var so it can be reset on changes.
  // If the Face Landmarker will not change, a lazy val would be preferable.
  private var faceLandmarker: FaceLandmarker? = null
  private var imageRotation = 0

  init {
    setupFaceLandmarker()
  }

  fun clearFaceLandmarker() {
    faceLandmarkDetectorListener = null
    // This is a hack. If we call close directly, we crash. There is a theory
    // that this is because the object detector is still doing some processing, and that
    // it is not safe to close it. So a better solution might be to mark it and then when
    // processing is complete, cause it to be closed.
    Handler(Looper.getMainLooper())
      .postDelayed(
        {
          faceLandmarker?.close()
          faceLandmarker = null
        },
        100
      )
  }

  // Initialize the Face landmarker using current settings on the
  // thread that is using it. CPU can be used with Landmarker
  // that are created on the main thread and used on a background thread, but
  // the GPU delegate needs to be used on the thread that initialized the
  // Landmarker
  fun setupFaceLandmarker() {
    // Set general face landmarker options
    val baseOptionBuilder = BaseOptions.builder()

    // Use the specified hardware for running the model. Default to CPU
    when (currentDelegate) {
      DELEGATE_CPU -> {
        baseOptionBuilder.setDelegate(Delegate.CPU)
      }

      DELEGATE_GPU -> {
        baseOptionBuilder.setDelegate(Delegate.GPU)
      }
    }

    baseOptionBuilder.setModelAssetPath(currentModel)

    // Check if runningMode is consistent with faceLandmarkerHelperListener
    when (runningMode) {
      RunningMode.LIVE_STREAM -> {
        if (faceLandmarkDetectorListener == null) {
          throw IllegalStateException(
            "faceLandmarkDetectorListener must be set when runningMode is LIVE_STREAM."
          )
        }
      }

      else -> {
        // no-op
      }
    }

    try {
      val baseOptions = baseOptionBuilder.build()
      // Create an option builder with base options and specific
      // options only use for Face Landmarker.
      val optionsBuilder =
        FaceLandmarker.FaceLandmarkerOptions.builder()
          .setBaseOptions(baseOptions)
          .setMinFaceDetectionConfidence(minFaceDetectionConfidence)
          .setMinTrackingConfidence(minFaceTrackingConfidence)
          .setMinFacePresenceConfidence(minFacePresenceConfidence)
          .setNumFaces(maxNumFaces)
          .setOutputFaceBlendshapes(true)
          .setRunningMode(runningMode)

      // The ResultListener and ErrorListener only use for LIVE_STREAM mode.
      if (runningMode == RunningMode.LIVE_STREAM) {
        optionsBuilder
          .setRunningMode(runningMode)
          .setResultListener(this::returnLivestreamResult)
          .setErrorListener(this::returnLivestreamError)
      } else {
        optionsBuilder.setRunningMode(runningMode)
      }

      val options = optionsBuilder.build()
      faceLandmarker = FaceLandmarker.createFromOptions(context, options)
    } catch (e: IllegalStateException) {
      faceLandmarkDetectorListener?.onError(
        "Face Landmarker failed to initialize. See error logs for " + "details"
      )
      Log.e(TAG, "MediaPipe failed to load the task with error: " + e.message)
    } catch (e: RuntimeException) {
      // This occurs if the model being used does not support GPU
      faceLandmarkDetectorListener?.onError(
        "Face Landmarker failed to initialize. See error logs for " + "details",
        GPU_ERROR
      )
      Log.e(TAG, "Face Landmarker failed to load model with error: " + e.message)
    }
  }

  fun isClosed(): Boolean {
    return faceLandmarker == null
  }

  // Accepts the URI for a video file loaded from the user's gallery and attempts to run
  // face landmarker inference on the video. This process will evaluate every
  // frame in the video and attach the results to a bundle that will be
  // returned.
  fun detectVideoFile(videoUri: Uri, inferenceIntervalMs: Long): ResultBundle? {
    if (runningMode != RunningMode.VIDEO) {
      throw IllegalArgumentException(
        "Attempting to call detectVideoFile" + " while not using RunningMode.VIDEO"
      )
    }

    if (faceLandmarker == null) {
      return null
    }

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    var didErrorOccurred = false

    // Load frames from the video and run the face landmarker.
    val retriever = MediaMetadataRetriever()
    retriever.setDataSource(context, videoUri)
    val videoLengthMs =
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLong()

    // Note: We need to read width/height from frame instead of getting the width/height
    // of the video directly because MediaRetriever returns frames that are smaller than the
    // actual dimension of the video file.
    val firstFrame = retriever.getFrameAtTime(0)
    val width = firstFrame?.width
    val height = firstFrame?.height

    // If the video is invalid, returns a null detection result
    if ((videoLengthMs == null) || (width == null) || (height == null)) return null

    // Next, we'll get one frame every frameInterval ms, then run detection on these frames.
    val resultList = mutableListOf<FaceLandmarkerResult>()
    val numberOfFrameToRead = videoLengthMs.div(inferenceIntervalMs)

    for (i in 0..numberOfFrameToRead) {
      val timestampMs = i * inferenceIntervalMs // ms

      retriever.getFrameAtTime(
        timestampMs * 1000, // convert from ms to micro-s
        MediaMetadataRetriever.OPTION_CLOSEST
      )
        ?.let { frame ->
          // Convert the video frame to ARGB_8888 which is required by the MediaPipe
          val argb8888Frame =
            if (frame.config == Bitmap.Config.ARGB_8888) frame
            else frame.copy(Bitmap.Config.ARGB_8888, false)

          // Convert the input Bitmap object to an MPImage object to run inference
          val mpImage = BitmapImageBuilder(argb8888Frame).build()

          // Run face landmarker using MediaPipe Face Landmarker API
          faceLandmarker?.detectForVideo(mpImage, timestampMs)?.let { detectionResult ->
            resultList.add(detectionResult)
          }
            ?: {
              didErrorOccurred = true
              faceLandmarkDetectorListener?.onError(
                "ResultBundle could not be returned" + " in detectVideoFile"
              )
            }
        }
        ?: run {
          didErrorOccurred = true
          faceLandmarkDetectorListener?.onError(
            "Frame at specified time could not be" + " retrieved when detecting in video."
          )
        }
    }

    retriever.release()

    val inferenceTimePerFrameMs = (SystemClock.uptimeMillis() - startTime).div(numberOfFrameToRead)

    return if (didErrorOccurred) {
      null
    } else {
      ResultBundle(resultList, inferenceTimePerFrameMs, height, width)
    }
  }

  // Convert the ImageProxy to MP Image and feed it to FacelandmakerHelper.
  fun detectLiveStream(mpImage: MPImage, orientation: Orientation) {
    if (runningMode != RunningMode.LIVE_STREAM) {
      throw IllegalArgumentException(
        "Attempting to call detectLiveStream" + " while not using RunningMode.LIVE_STREAM"
      )
    }
    val frameTime = SystemClock.uptimeMillis()
    // this is a hack bc we use this in the callback and it might have changed
    this.imageRotation = orientationToDegrees(orientation)
    detectAsync(mpImage, frameTime, this.imageRotation)
  }

  // Run face face landmark using MediaPipe Face Landmarker API
  @VisibleForTesting
  fun detectAsync(mpImage: MPImage, frameTime: Long, imageRotation: Int) {
    val imageProcessingOptions =
      ImageProcessingOptions.builder().setRotationDegrees(imageRotation).build()
    faceLandmarker?.detectAsync(mpImage, imageProcessingOptions, frameTime)
    // As we're using running mode LIVE_STREAM, the landmark result will
    // be returned in returnLivestreamResult function
  }

  // Accepted a Bitmap and runs face landmarker inference on it to return
  // results back to the caller
  fun detectImage(image: Bitmap): ResultBundle {
    if (runningMode != RunningMode.IMAGE) {
      throw IllegalArgumentException(
        "Attempting to call detectImage" + " while not using RunningMode.IMAGE"
      )
    }

    // Inference time is the difference between the system time at the
    // start and finish of the process
    val startTime = SystemClock.uptimeMillis()

    // Convert the input Bitmap object to an MPImage object to run inference
    val mpImage = BitmapImageBuilder(image).build()

    // Run face landmarker using MediaPipe Face Landmarker API
    faceLandmarker?.detect(mpImage)?.also { landmarkResult ->
      val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
      return ResultBundle(listOf(landmarkResult), inferenceTimeMs, image.height, image.width)
    }

    throw Exception("Face Landmarker failed to detect.")
  }

  // Return the landmark result to this FaceLandmarkerHelper's caller
  private fun returnLivestreamResult(result: FaceLandmarkerResult, input: MPImage) {
    if (result.faceLandmarks().size > 0) {
      val finishTimeMs = SystemClock.uptimeMillis()
      val inferenceTime = finishTimeMs - result.timestampMs()

      faceLandmarkDetectorListener?.onResults(
        ResultBundle(listOf(result), inferenceTime, input.height, input.width)
      )
    } else {
      faceLandmarkDetectorListener?.onEmpty()
    }
  }

  // Return errors thrown during detection to this FaceLandmarkerHelper's
  // caller
  private fun returnLivestreamError(error: RuntimeException) {
    faceLandmarkDetectorListener?.onError(error.message ?: "An unknown error has occurred")
  }

  companion object {
    const val TAG = "FaceLandmarkerHelper"

    const val DELEGATE_CPU = 0
    const val DELEGATE_GPU = 1
    const val DEFAULT_FACE_DETECTION_CONFIDENCE = 0.5F
    const val DEFAULT_FACE_TRACKING_CONFIDENCE = 0.5F
    const val DEFAULT_FACE_PRESENCE_CONFIDENCE = 0.5F
    const val DEFAULT_NUM_FACES = 1
    const val OTHER_ERROR = 0
    const val GPU_ERROR = 1
  }

  data class ResultBundle(
    val results: List<FaceLandmarkerResult>,
    val inferenceTime: Long,
    val inputImageHeight: Int,
    val inputImageWidth: Int,
    val inputImageRotation: Int = 0
  )

  interface DetectorListener {
    fun onError(error: String, errorCode: Int = OTHER_ERROR)
    fun onResults(resultBundle: ResultBundle)

    fun onEmpty() {}
  }
}
