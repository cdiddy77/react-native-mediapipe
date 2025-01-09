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
    var faceLandmarkDetectorListener: DetectorListener? = null
) {

  private var faceLandmarker: FaceLandmarker? = null
  private var imageRotation = 0

  init {
    setupFaceLandmarker()
  }

  fun clearFaceLandmarker() {
    faceLandmarkDetectorListener = null
    Handler(Looper.getMainLooper())
        .postDelayed(
            {
              faceLandmarker?.close()
              faceLandmarker = null
            },
            100
        )
  }

  private fun setupFaceLandmarker() {
    val baseOptionBuilder = BaseOptions.builder()

    when (currentDelegate) {
      DELEGATE_CPU -> {
        baseOptionBuilder.setDelegate(Delegate.CPU)
      }
      DELEGATE_GPU -> {
        baseOptionBuilder.setDelegate(Delegate.GPU)
      }
    }

    baseOptionBuilder.setModelAssetPath(currentModel)

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
      val optionsBuilder =
          FaceLandmarker.FaceLandmarkerOptions.builder()
              .setBaseOptions(baseOptions)
              .setMinFaceDetectionConfidence(minFaceDetectionConfidence)
              .setMinTrackingConfidence(minFaceTrackingConfidence)
              .setMinFacePresenceConfidence(minFacePresenceConfidence)
              .setNumFaces(maxNumFaces)
              .setOutputFaceBlendshapes(true)
              .setRunningMode(runningMode)

      if (runningMode == RunningMode.LIVE_STREAM) {
        optionsBuilder
            .setRunningMode(runningMode)
            .setResultListener(this::returnLivestreamResult)
            .setErrorListener(this::returnLivestreamError)
      }

      val options = optionsBuilder.build()
      faceLandmarker = FaceLandmarker.createFromOptions(context, options)
    } catch (e: IllegalStateException) {
      faceLandmarkDetectorListener?.onError(
          "Face Landmarker failed to initialize. See error logs for details"
      )
      Log.e(TAG, "MediaPipe failed to load the task with error: " + e.message)
    } catch (e: RuntimeException) {
      faceLandmarkDetectorListener?.onError(
          "Face Landmarker failed to initialize. See error logs for details",
          GPU_ERROR
      )
      Log.e(TAG, "Face Landmarker failed to load model with error: " + e.message)
    }
  }

  fun isClosed(): Boolean {
    return faceLandmarker == null
  }

  fun detectImage(image: Bitmap): ResultBundle {
    if (runningMode != RunningMode.IMAGE) {
      throw IllegalArgumentException(
          "Attempting to call detectImage while not using RunningMode.IMAGE"
      )
    }

    val startTime = SystemClock.uptimeMillis()
    val mpImage = BitmapImageBuilder(image).build()

    faceLandmarker?.detect(mpImage)?.also { landmarkResult ->
      val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
      return ResultBundle(
          results = listOf(landmarkResult),
          inferenceTime = inferenceTimeMs,
          inputImageHeight = image.height,
          inputImageWidth = image.width,
          inputImageRotation = imageRotation
      )
    }

    throw Exception("Face Landmarker failed to detect.")
  }

  fun detectLiveStream(mpImage: MPImage, orientation: Orientation) {
    if (runningMode != RunningMode.LIVE_STREAM) {
      throw IllegalArgumentException(
          "Attempting to call detectLiveStream while not using RunningMode.LIVE_STREAM"
      )
    }
    val frameTime = SystemClock.uptimeMillis()
    //this.imageRotation = orientationToDegrees(orientation)
    this.imageRotation = orientationToDegrees(Orientation.PORTRAIT)
    detectAsync(mpImage, frameTime, this.imageRotation)
  }

  @VisibleForTesting
  fun detectAsync(mpImage: MPImage, frameTime: Long, imageRotation: Int) {
    val imageProcessingOptions = ImageProcessingOptions.builder()
        .setRotationDegrees(imageRotation)
        .build()
    faceLandmarker?.detectAsync(mpImage, imageProcessingOptions, frameTime)
  }

  private fun returnLivestreamResult(result: FaceLandmarkerResult, input: MPImage) {
    if (result.faceLandmarks().size > 0) {
      val finishTimeMs = SystemClock.uptimeMillis()
      val inferenceTime = finishTimeMs - result.timestampMs()

      faceLandmarkDetectorListener?.onResults(
          ResultBundle(
              results = listOf(result),
              inferenceTime = inferenceTime,
              inputImageHeight = input.height,
              inputImageWidth = input.width,
              inputImageRotation = imageRotation
          )
      )
    } else {
      faceLandmarkDetectorListener?.onEmpty()
    }
  }

  private fun returnLivestreamError(error: RuntimeException) {
    faceLandmarkDetectorListener?.onError(
        error.message ?: "An unknown error has occurred"
    )
  }

  companion object {
    const val TAG = "FaceLandmarkDetectorHelper"
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
