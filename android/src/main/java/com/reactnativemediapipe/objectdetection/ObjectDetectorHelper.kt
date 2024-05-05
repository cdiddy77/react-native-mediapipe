package com.reactnativemediapipe.objectdetection

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
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetectorResult
import com.mrousavy.camera.core.types.Orientation

class ObjectDetectorHelper(
    var threshold: Float = THRESHOLD_DEFAULT,
    var maxResults: Int = MAX_RESULTS_DEFAULT,
    var currentDelegate: Int = DELEGATE_CPU,
    var currentModel: String,
    var runningMode: RunningMode = RunningMode.IMAGE,
    val context: Context,
    // The listener is only used when running in RunningMode.LIVE_STREAM
    var objectDetectorListener: DetectorListener? = null
) {

  // For this example this needs to be a var so it can be reset on changes. If the ObjectDetector
  // will not change, a lazy val would be preferable.
  private var objectDetector: ObjectDetector? = null
  private var imageRotation = 0
  //  private lateinit var imageProcessingOptions: ImageProcessingOptions

  init {
    setupObjectDetector()
  }

  fun clearObjectDetector() {
    objectDetectorListener = null
    // This is a hack. If we call close directly, we crash. There is a theory
    // that this is because the object detector is still doing some processing, and that
    // it is not safe to close it. So a better solution might be to mark it and then when
    // processing is complete, cause it to be closed.
    Handler(Looper.getMainLooper())
        .postDelayed(
            {
              objectDetector?.close()
              objectDetector = null
            },
            100
        )
  }

  // Initialize the object detector using current settings on the
  // thread that is using it. CPU can be used with detectors
  // that are created on the main thread and used on a background thread, but
  // the GPU delegate needs to be used on the thread that initialized the detector
  private fun setupObjectDetector() {
    // Set general detection options, including number of used threads
    val baseOptionsBuilder = BaseOptions.builder()

    // Use the specified hardware for running the model. Default to CPU
    when (currentDelegate) {
      DELEGATE_CPU -> {
        baseOptionsBuilder.setDelegate(Delegate.CPU)
      }
      DELEGATE_GPU -> {
        // Is there a check for GPU being supported?
        baseOptionsBuilder.setDelegate(Delegate.GPU)
      }
    }

    baseOptionsBuilder.setModelAssetPath(currentModel)

    // Check if runningMode is consistent with objectDetectorListener
    when (runningMode) {
      RunningMode.LIVE_STREAM -> {
        if (objectDetectorListener == null) {
          throw IllegalStateException(
              "objectDetectorListener must be set when runningMode is LIVE_STREAM."
          )
        }
      }
      RunningMode.IMAGE, RunningMode.VIDEO -> {
        // no-op
      }
    }

    try {
      val optionsBuilder =
          ObjectDetector.ObjectDetectorOptions.builder()
              .setBaseOptions(baseOptionsBuilder.build())
              .setScoreThreshold(threshold)
              .setRunningMode(runningMode)
              .setMaxResults(maxResults)

      when (runningMode) {
        RunningMode.IMAGE, RunningMode.VIDEO -> optionsBuilder.setRunningMode(runningMode)
        RunningMode.LIVE_STREAM ->
            optionsBuilder
                .setRunningMode(runningMode)
                .setResultListener(this::returnLivestreamResult)
                .setErrorListener(this::returnLivestreamError)
      }

      val options = optionsBuilder.build()
      objectDetector = ObjectDetector.createFromOptions(context, options)
    } catch (e: IllegalStateException) {
      objectDetectorListener?.onError("Object detector failed to initialize: " + e.message)
      Log.e(TAG, "TFLite failed to load model with error: " + e.message)
    } catch (e: RuntimeException) {
      objectDetectorListener?.onError("Object detector failed to initialize: " + e.message)
      Log.e(TAG, "Object detector failed to load model with error: " + e.message)
    } catch (e: Exception) {
      objectDetectorListener?.onError("Object detector failed to initialize: " + e.message)
      Log.e(TAG, "TFLite failed to load model with error: " + e.message)
    }
  }

  // Return running status of recognizer helper
  fun isClosed(): Boolean {
    return objectDetector == null
  }

  // Accepts the URI for a video file loaded from the user's gallery and attempts to run
  // object detection inference on the video. This process will evaluate every frame in
  // the video and attach the results to a bundle that will be returned.
  fun detectVideoFile(videoUri: Uri, inferenceIntervalMs: Long): ResultBundle? {

    if (runningMode != RunningMode.VIDEO) {
      throw IllegalArgumentException(
          "Attempting to call detectVideoFile" + " while not using RunningMode.VIDEO"
      )
    }

    if (objectDetector == null) return null

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    var didErrorOccurred = false

    // Load frames from the video and run the object detection model.
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
    val resultList = mutableListOf<ObjectDetectorResult>()
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

            // Run object detection using MediaPipe Object Detector API
            objectDetector?.detectForVideo(mpImage, timestampMs)?.let { detectionResult ->
              resultList.add(detectionResult)
            }
                ?: {
                  didErrorOccurred = true
                  objectDetectorListener?.onError(
                      "ResultBundle could not be returned" + " in detectVideoFile"
                  )
                }
          }
          ?: run {
            didErrorOccurred = true
            objectDetectorListener?.onError(
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

  // Runs object detection on live streaming cameras frame-by-frame and returns the results
  // asynchronously to the caller.
  fun detectLivestreamFrame(mpImage: MPImage, orientation: Orientation) {

    if (runningMode != RunningMode.LIVE_STREAM) {
      throw IllegalArgumentException(
          "Attempting to call detectLivestreamFrame" + " while not using RunningMode.LIVE_STREAM"
      )
    }

    val frameTime = SystemClock.uptimeMillis()
    // this is a hack bc we use this in the callback and it might have changed
    this.imageRotation = orientationToDegrees(orientation)
    detectAsync(mpImage, frameTime, this.imageRotation)
  }

  // Run object detection using MediaPipe Object Detector API
  @VisibleForTesting
  fun detectAsync(mpImage: MPImage, frameTime: Long, imageRotation: Int) {
    // As we're using running mode LIVE_STREAM, the detection result will be returned in
    // returnLivestreamResult function
    val imageProcessingOptions =
        ImageProcessingOptions.builder().setRotationDegrees(imageRotation).build()
    objectDetector?.detectAsync(mpImage, imageProcessingOptions, frameTime)
  }

  // Return the detection result to this ObjectDetectorHelper's caller
  private fun returnLivestreamResult(result: ObjectDetectorResult, input: MPImage) {
    val finishTimeMs = SystemClock.uptimeMillis()
    val inferenceTime = finishTimeMs - result.timestampMs()

    objectDetectorListener?.onResults(
        ResultBundle(listOf(result), inferenceTime, input.height, input.width, imageRotation)
    )
  }

  // Return errors thrown during detection to this ObjectDetectorHelper's caller
  private fun returnLivestreamError(error: RuntimeException) {
    objectDetectorListener?.onError(error.message ?: "An unknown error has occurred")
  }

  // Accepted a Bitmap and runs object detection inference on it to return results back
  // to the caller
  fun detectImage(image: Bitmap): ResultBundle? {

    if (runningMode != RunningMode.IMAGE) {
      throw IllegalArgumentException(
          "Attempting to call detectImage" + " while not using RunningMode.IMAGE"
      )
    }

    if (objectDetector == null) return null

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    // Convert the input Bitmap object to an MPImage object to run inference
    val mpImage = BitmapImageBuilder(image).build()

    // Run object detection using MediaPipe Object Detector API
    objectDetector?.detect(mpImage)?.also { detectionResult ->
      val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
      return ResultBundle(listOf(detectionResult), inferenceTimeMs, image.height, image.width)
    }

    // If objectDetector?.detect() returns null, this is likely an error. Returning null
    // to indicate this.
    return null
  }

  // Wraps results from inference, the time it takes for inference to be performed, and
  // the input image and height for properly scaling UI to return back to callers
  data class ResultBundle(
      val results: List<ObjectDetectorResult>,
      val inferenceTime: Long,
      val inputImageHeight: Int,
      val inputImageWidth: Int,
      val inputImageRotation: Int = 0
  )

  companion object {
    const val DELEGATE_CPU = 0
    const val DELEGATE_GPU = 1

    const val MAX_RESULTS_DEFAULT = 3
    const val THRESHOLD_DEFAULT = 0.5F
    const val OTHER_ERROR = 0
    const val GPU_ERROR = 1

    const val TAG = "ObjectDetectorHelper"
  }

  // Used to pass results or errors back to the calling class
  interface DetectorListener {
    fun onError(error: String, errorCode: Int = OTHER_ERROR)
    fun onResults(resultBundle: ResultBundle)
  }
}
