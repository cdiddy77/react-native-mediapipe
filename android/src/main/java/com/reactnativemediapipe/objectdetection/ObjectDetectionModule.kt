package com.reactnativemediapipe.objectdetection

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.reactnativemediapipe.shared.loadBitmapFromPath

object ObjectDetectorMap {
  internal val detectorMap = mutableMapOf<Int, ObjectDetectorHelper>()

}

class ObjectDetectionModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var nextId = 22 // just not zero

  override fun getName(): String {
    return "ObjectDetection"
  }

  private class ObjectDetectorListener(
    private val module: ObjectDetectionModule,
    private val handle: Int
  ) :
    ObjectDetectorHelper.DetectorListener {
    override fun onError(error: String, errorCode: Int) {
      module.sendErrorEvent(handle, error, errorCode)
    }

    override fun onResults(resultBundle: ObjectDetectorHelper.ResultBundle) {
      module.sendResultsEvent(handle, resultBundle)
    }
  }

  @ReactMethod
  fun createDetector(
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    model: String,
    runningMode: Int,
    promise: Promise
  ) {
    val id = nextId++
    val helper = ObjectDetectorHelper(
      threshold = threshold,
      maxResults = maxResults,
      currentDelegate = delegate,
      currentModel = model,
      runningMode = enumValues<RunningMode>().first { it.ordinal == runningMode },
      context = reactApplicationContext.applicationContext,
      objectDetectorListener = ObjectDetectorListener(this, id)
    )
    ObjectDetectorMap.detectorMap[id] = helper
    promise.resolve(id)
  }

  @ReactMethod
  fun releaseDetector(handle: Int, promise: Promise) {
    val entry = ObjectDetectorMap.detectorMap[handle]
    if (entry != null) {
      entry.clearObjectDetector()
      ObjectDetectorMap.detectorMap.remove(handle)
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun detectOnImage(
    imagePath: String,
    threshold: Float,
    maxResults: Int,
    delegate: Int,
    model: String,
    promise: Promise
  ) {
    try {
      Log.i(TAG,"imagePath:$imagePath")
      val helper = ObjectDetectorHelper(
        threshold = threshold,
        maxResults = maxResults,
        currentDelegate = delegate,
        currentModel = model,
        runningMode = RunningMode.IMAGE,
        context = reactApplicationContext.applicationContext,
        objectDetectorListener = ObjectDetectorListener(this, 0)
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

    reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("onError", errorArgs)
  }

  private fun sendResultsEvent(handle: Int, bundle: ObjectDetectorHelper.ResultBundle) {
    val resultArgs = convertResultBundleToWritableMap(bundle)
    resultArgs.putInt("handle", handle)
    reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("onResults", resultArgs)
  }

  companion object {
    const val TAG = "ObjectDetectionModule"
  }
}
