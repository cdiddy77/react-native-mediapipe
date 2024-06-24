package com.reactnativemediapipe

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import com.reactnativemediapipe.facelandmarkdetection.FaceLandmarkDetectionFrameProcessorPlugin
import com.reactnativemediapipe.facelandmarkdetection.FaceLandmarkDetectionModule
import com.reactnativemediapipe.objectdetection.ObjectDetectionFrameProcessorPlugin
import com.reactnativemediapipe.objectdetection.ObjectDetectionModule
import com.reactnativemediapipe.posedetection.PoseDetectionFrameProcessorPlugin
import com.reactnativemediapipe.posedetection.PoseDetectionModule


class MediapipePackage : ReactPackage {
  companion object {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("objectDetection") { _, _ ->
        ObjectDetectionFrameProcessorPlugin()
      }
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("faceLandmarkDetection") { _, _ ->
        FaceLandmarkDetectionFrameProcessorPlugin()
      }
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("poseDetection") { _, _ ->
        PoseDetectionFrameProcessorPlugin()
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      ObjectDetectionModule(reactContext),
      FaceLandmarkDetectionModule(reactContext),
      PoseDetectionModule(reactContext)
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(MediapipeViewManager())
  }
}
