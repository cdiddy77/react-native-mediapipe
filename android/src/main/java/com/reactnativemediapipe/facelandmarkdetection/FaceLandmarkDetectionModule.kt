package com.reactnativemediapipe.facelandmarkdetection

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.reactnativemediapipe.shared.loadBitmapFromPath

object FaceLandmarkDetectorMap {
  internal val detectorMap = mutableMapOf<Int, FaceLandmarkDetectorHelper>()
}

class FaceLandmarkDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private var nextId = 22 // just not zero

  override fun getName(): String {
    return "FaceLandmarkDetection"
  }

  override fun getConstants(): MutableMap<String, Any>? {
    val knownLandmarks = WritableNativeMap()
    knownLandmarks.putArray(
        "lips",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_LIPS)
    )
    knownLandmarks.putArray(
        "leftEye",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE)
    )
    knownLandmarks.putArray(
        "leftEyebrow",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE_BROW)
    )
    knownLandmarks.putArray(
        "leftIris",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS)
    )
    knownLandmarks.putArray(
        "rightEye",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE)
    )
    knownLandmarks.putArray(
        "rightEyebrow",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE_BROW)
    )
    knownLandmarks.putArray(
        "rightIris",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS)
    )
    knownLandmarks.putArray(
        "faceOval",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL)
    )
    knownLandmarks.putArray(
        "connectors",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_CONNECTORS)
    )
    knownLandmarks.putArray(
        "tesselation",
        connectionSetToWritableArray(FaceLandmarker.FACE_LANDMARKS_TESSELATION)
    )

    return hashMapOf("knownLandmarks" to knownLandmarks)
  }

  private class FaceLandmarkDetectorListener(
      private val module: FaceLandmarkDetectionModule,
      private val handle: Int
  ) : FaceLandmarkDetectorHelper.DetectorListener {
    override fun onError(error: String, errorCode: Int) {
      module.sendErrorEvent(handle, error, errorCode)
    }

    override fun onResults(resultBundle: FaceLandmarkDetectorHelper.ResultBundle) {
      module.sendResultsEvent(handle, resultBundle)
    }
  }

  @ReactMethod
  fun createDetector(
      numFaces: Int,
      minFaceDetectionConfidence: Float,
      minFacePresenceConfidence: Float,
      minTrackingConfidence: Float,
      model: String,
      delegate: Int,
      runningMode: Int,
      promise: Promise
  ) {
    val id = nextId++
    val helper =
        FaceLandmarkDetectorHelper(
            maxNumFaces = numFaces,
            minFaceDetectionConfidence = minFaceDetectionConfidence,
            minFacePresenceConfidence = minFacePresenceConfidence,
            minFaceTrackingConfidence = minTrackingConfidence,
            currentDelegate = delegate,
            currentModel = model,
            runningMode = enumValues<RunningMode>().first { it.ordinal == runningMode },
            context = reactApplicationContext.applicationContext,
            faceLandmarkDetectorListener = FaceLandmarkDetectorListener(this, id)
        )
    FaceLandmarkDetectorMap.detectorMap[id] = helper
    promise.resolve(id)
  }

  @ReactMethod
  fun releaseDetector(handle: Int, promise: Promise) {
    val entry = FaceLandmarkDetectorMap.detectorMap[handle]
    if (entry != null) {
      entry.clearFaceLandmarker()
      FaceLandmarkDetectorMap.detectorMap.remove(handle)
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun detectOnImage(
      imagePath: String,
      numFaces: Int,
      minFaceDetectionConfidence: Float,
      minFacePresenceConfidence: Float,
      minTrackingConfidence: Float,
      model: String,
      delegate: Int,
      promise: Promise
  ) {
    try {
      val helper =
          FaceLandmarkDetectorHelper(
              maxNumFaces = numFaces,
              minFaceDetectionConfidence = minFaceDetectionConfidence,
              minFacePresenceConfidence = minFacePresenceConfidence,
              minFaceTrackingConfidence = minTrackingConfidence,
              currentDelegate = delegate,
              currentModel = model,
              runningMode = RunningMode.IMAGE,
              context = reactApplicationContext.applicationContext,
              faceLandmarkDetectorListener = FaceLandmarkDetectorListener(this, 0)
          )
      val bundle = helper.detectImage(loadBitmapFromPath(imagePath))
      val resultArgs = convertResultBundleToWritableMap(bundle)

      promise.resolve(resultArgs)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  fun detectOnVideo(
      videoPath: String,
      threshold: Float,
      maxResults: Int,
      delegate: Int,
      model: String,
      promise: Promise
  ) {
    promise.reject(UnsupportedOperationException("detectOnVideo not yet implemented"))
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  @ReactMethod
  fun removeListeners(count: Int?) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  private fun sendErrorEvent(handle: Int, message: String, code: Int) {
    val errorArgs =
        Arguments.makeNativeMap(mapOf("handle" to handle, "message" to message, "code" to code))

    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onError", errorArgs)
  }

  private fun sendResultsEvent(handle: Int, bundle: FaceLandmarkDetectorHelper.ResultBundle) {
    val resultArgs = convertResultBundleToWritableMap(bundle)
    resultArgs.putInt("handle", handle)
    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onResults", resultArgs)
  }

  companion object {
    const val TAG = "FaceLandmarkDetectionModule"
  }
}
