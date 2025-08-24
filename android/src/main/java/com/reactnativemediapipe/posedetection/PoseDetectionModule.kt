package com.reactnativemediapipe.posedetection

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.reactnativemediapipe.shared.loadBitmapFromPath

object PoseDetectorMap {
  internal val detectorMap = mutableMapOf<Int, PoseDetectorHelper>()
}

class PoseDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private var nextId = 23 // just not zero

  override fun getName(): String {
    return "PoseDetection"
  }

  private class PoseDetectorListener(
      private val module: PoseDetectionModule,
      private val handle: Int
  ) : PoseDetectorHelper.DetectorListener {
    override fun onError(error: String, errorCode: Int) {
      module.sendErrorEvent(handle, error, errorCode)
    }

    override fun onResults(resultBundle: PoseDetectorHelper.ResultBundle) {
      module.sendResultsEvent(handle, resultBundle)
    }
  }

  @ReactMethod
  fun createDetector(
      numPoses: Int,
      minPoseDetectionConfidence: Float,
      minPosePresenceConfidence: Float,
      minTrackingConfidence: Float,
      shouldOutputSegmentationMasks: Boolean,
      model: String,
      delegate: Int,
      runningMode: Int,
      promise: Promise
  ) {
    val id = nextId++
    val helper =
        PoseDetectorHelper(
            maxNumPoses = numPoses,
            minPoseDetectionConfidence = minPoseDetectionConfidence,
            minPosePresenceConfidence = minPosePresenceConfidence,
            minPoseTrackingConfidence = minTrackingConfidence,
            shouldOutputSegmentationMasks = shouldOutputSegmentationMasks,
            currentDelegate = delegate,
            currentModel = model,
            runningMode = enumValues<RunningMode>().first { it.ordinal == runningMode },
            context = reactApplicationContext.applicationContext,
            poseDetectorListener = PoseDetectorListener(this, id)
        )
    PoseDetectorMap.detectorMap[id] = helper
    promise.resolve(id)
  }

  @ReactMethod
  fun releaseDetector(handle: Int, promise: Promise) {
    val entry = PoseDetectorMap.detectorMap[handle]
    if (entry != null) {
      entry.clearPoseLandmarker()
      PoseDetectorMap.detectorMap.remove(handle)
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun detectOnImage(
      imagePath: String,
      numPoses: Int,
      minPoseDetectionConfidence: Float,
      minPosePresenceConfidence: Float,
      minTrackingConfidence: Float,
      shouldOutputSegmentationMasks: Boolean,
      model: String,
      delegate: Int,
      promise: Promise
  ) {
    try {
      val helper =
          PoseDetectorHelper(
              maxNumPoses = numPoses,
              minPoseDetectionConfidence = minPoseDetectionConfidence,
              minPosePresenceConfidence = minPosePresenceConfidence,
              minPoseTrackingConfidence = minTrackingConfidence,
              shouldOutputSegmentationMasks = shouldOutputSegmentationMasks,
              currentDelegate = delegate,
              currentModel = model,
              runningMode = RunningMode.IMAGE,
              context = reactApplicationContext.applicationContext,
              poseDetectorListener = PoseDetectorListener(this, 0)
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

  private fun sendResultsEvent(handle: Int, bundle: PoseDetectorHelper.ResultBundle) {
    val resultArgs = convertResultBundleToWritableMap(bundle)
    resultArgs.putInt("handle", handle)
    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onResults", resultArgs)
  }

  companion object {
    const val TAG = "PoseDetectionModule"
  }
}
