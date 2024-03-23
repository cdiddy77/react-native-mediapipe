package com.reactnativemediapipe.objectdetection

import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessor.VisionCameraProxy

class ObjectDetectionFrameProcessorPlugin() :
  FrameProcessorPlugin() {

  override fun callback(frame: Frame, params: MutableMap<String, Any>?): Any? {
    val detectorHandle:Double = params!!["detectorHandle"] as Double
    val detector = ObjectDetectorMap.detectorMap[detectorHandle.toInt()] ?: return false

    val image = frame.image
    detector.detectLivestreamFrame(image)
    return true
  }
}
