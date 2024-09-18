package com.reactnativemediapipe.posedetection

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
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.mrousavy.camera.core.types.Orientation
import com.reactnativemediapipe.shared.orientationToDegrees

class PoseDetectorHelper(
        var minPoseDetectionConfidence: Float = DEFAULT_POSE_DETECTION_CONFIDENCE,
        var minPoseTrackingConfidence: Float = DEFAULT_POSE_TRACKING_CONFIDENCE,
        var minPosePresenceConfidence: Float = DEFAULT_POSE_PRESENCE_CONFIDENCE,
        var maxNumPoses: Int = DEFAULT_NUM_POSES,
        var shouldOutputSegmentationMasks: Boolean = DEFAULT_SHOULD_OUTPUT_SEGMENTATION_MASKS,
        var currentDelegate: Int = DELEGATE_CPU,
        var currentModel: String,
        var runningMode: RunningMode = RunningMode.IMAGE,
        val context: Context,
        // this listener is only used when running in RunningMode.LIVE_STREAM
        var poseDetectorListener: DetectorListener? = null
) {

  // For this example this needs to be a var so it can be reset on changes.
  // If the pose Landmarker will not change, a lazy val would be preferable.
  private var poseLandmarker: PoseLandmarker? = null
  private var imageRotation = 0

  init {
    setupPoseLandmarker()
  }

  fun clearPoseLandmarker() {
    poseDetectorListener = null
    // This is a hack. If we call close directly, we crash. There is a theory
    // that this is because the object detector is still doing some processing, and that
    // it is not safe to close it. So a better solution might be to mark it and then when
    // processing is complete, cause it to be closed.
    Handler(Looper.getMainLooper())
            .postDelayed(
                    {
                      poseLandmarker?.close()
                      poseLandmarker = null
                    },
                    100
            )
  }

  // Initialize the pose landmarker using current settings on the
  // thread that is using it. CPU can be used with Landmarker
  // that are created on the main thread and used on a background thread, but
  // the GPU delegate needs to be used on the thread that initialized the
  // Landmarker
  private fun setupPoseLandmarker() {
    // Set general pose landmarker options
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

    // Check if runningMode is consistent with PoseDetectorHelperListener
    when (runningMode) {
      RunningMode.LIVE_STREAM -> {
        if (poseDetectorListener == null) {
          throw IllegalStateException(
                  "poseDetectorListener must be set when runningMode is LIVE_STREAM."
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
      // options only use for pose Landmarker.
      val optionsBuilder =
              PoseLandmarker.PoseLandmarkerOptions.builder()
                      .setBaseOptions(baseOptions)
                      .setMinPoseDetectionConfidence(minPoseDetectionConfidence)
                      .setMinTrackingConfidence(minPoseTrackingConfidence)
                      .setMinPosePresenceConfidence(minPosePresenceConfidence)
                      .setNumPoses(maxNumPoses)
                      .setOutputSegmentationMasks(shouldOutputSegmentationMasks)
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
      poseLandmarker = PoseLandmarker.createFromOptions(context, options)
    } catch (e: IllegalStateException) {
      poseDetectorListener?.onError(
              "Pose Landmarker failed to initialize. See error logs for " + "details"
      )
      Log.e(TAG, "MediaPipe failed to load the task with error: " + e.message)
    } catch (e: RuntimeException) {
      // This occurs if the model being used does not support GPU
      poseDetectorListener?.onError(
              "Pose Landmarker failed to initialize. See error logs for " + "details",
              GPU_ERROR
      )
      Log.e(TAG, "Pose Landmarker failed to load model with error: " + e.message)
    }
  }

  fun isClosed(): Boolean {
    return poseLandmarker == null
  }

  // Accepts the URI for a video file loaded from the user's gallery and attempts to run
  // pose landmarker inference on the video. This process will evaluate every
  // frame in the video and attach the results to a bundle that will be
  // returned.
  fun detectVideoFile(videoUri: Uri, inferenceIntervalMs: Long): ResultBundle? {
    if (runningMode != RunningMode.VIDEO) {
      throw IllegalArgumentException(
              "Attempting to call detectVideoFile" + " while not using RunningMode.VIDEO"
      )
    }

    if (poseLandmarker == null) {
      return null
    }

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    var didErrorOccurred = false

    // Load frames from the video and run the pose landmarker.
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
    val resultList = mutableListOf<PoseLandmarkerResult>()
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

                // Run pose landmarker using MediaPipe pose Landmarker API
                poseLandmarker?.detectForVideo(mpImage, timestampMs)?.let { detectionResult ->
                  resultList.add(detectionResult)
                }
                        ?: {
                          didErrorOccurred = true
                          poseDetectorListener?.onError(
                                  "ResultBundle could not be returned" + " in detectVideoFile"
                          )
                        }
              }
              ?: run {
                didErrorOccurred = true
                poseDetectorListener?.onError(
                        "Frame at specified time could not be" +
                                " retrieved when detecting in video."
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
//    this.imageRotation = orientationToDegrees(orientation)
    this.imageRotation = orientationToDegrees(Orientation.PORTRAIT)
    //    this.imageRotation = 90
    detectAsync(mpImage, frameTime, this.imageRotation)
  }

  // Run face pose landmark using MediaPipe pose Landmarker API
  @VisibleForTesting
  fun detectAsync(mpImage: MPImage, frameTime: Long, imageRotation: Int) {
    val imageProcessingOptions =
            ImageProcessingOptions.builder().setRotationDegrees(imageRotation).build()
    poseLandmarker?.detectAsync(mpImage, imageProcessingOptions, frameTime)
    // As we're using running mode LIVE_STREAM, the landmark result will
    // be returned in returnLivestreamResult function
  }

  // Accepted a Bitmap and runs pose landmarker inference on it to return
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

    // Run pose landmarker using MediaPipe pose Landmarker API
    poseLandmarker?.detect(mpImage)?.also { landmarkResult ->
      val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
      return ResultBundle(listOf(landmarkResult), inferenceTimeMs, image.height, image.width)
    }

    throw Exception("pose Landmarker failed to detect.")
  }

  // Return the landmark result to this PoseDetectorHelper's caller
  private fun returnLivestreamResult(result: PoseLandmarkerResult, input: MPImage) {
    if (result.landmarks().size > 0) {
      val finishTimeMs = SystemClock.uptimeMillis()
      val inferenceTime = finishTimeMs - result.timestampMs()

      poseDetectorListener?.onResults(
              ResultBundle(listOf(result), inferenceTime, input.height, input.width)
      )
    } else {
      poseDetectorListener?.onEmpty()
    }
  }

  // Return errors thrown during detection to this PoseDetectorHelper's
  // caller
  private fun returnLivestreamError(error: RuntimeException) {
    poseDetectorListener?.onError(error.message ?: "An unknown error has occurred")
  }

  companion object {
    const val TAG = "PoseDetectorHelper"

    const val DELEGATE_CPU = 0
    const val DELEGATE_GPU = 1
    const val DEFAULT_SHOULD_OUTPUT_SEGMENTATION_MASKS = false
    const val DEFAULT_POSE_DETECTION_CONFIDENCE = 0.5F
    const val DEFAULT_POSE_TRACKING_CONFIDENCE = 0.5F
    const val DEFAULT_POSE_PRESENCE_CONFIDENCE = 0.5F
    const val DEFAULT_NUM_POSES = 1
    const val OTHER_ERROR = 0
    const val GPU_ERROR = 1
  }

  data class ResultBundle(
          val results: List<PoseLandmarkerResult>,
          val inferenceTime: Long,
          val inputImageHeight: Int,
          val inputImageWidth: Int,
  )

  interface DetectorListener {
    fun onError(error: String, errorCode: Int = OTHER_ERROR)
    fun onResults(resultBundle: ResultBundle)

    fun onEmpty() {}
  }
}
