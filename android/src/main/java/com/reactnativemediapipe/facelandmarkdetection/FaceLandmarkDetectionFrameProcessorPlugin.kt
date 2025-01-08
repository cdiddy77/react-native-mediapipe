package com.reactnativemediapipe.facelandmarkdetection

import com.google.mediapipe.framework.image.MediaImageBuilder
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.reactnativemediapipe.shared.imageOrientation

class FaceLandmarkDetectionFrameProcessorPlugin() : FrameProcessorPlugin() {

  companion object {
    private const val TAG = "FaceLandmarkDetectionFrameProcessorPlugin"
  }

  override fun callback(frame: Frame, params: MutableMap<String, Any>?): Any? {
    val detectorHandle = (params?.get("detectorHandle") as? Double) ?: return false
    val detector = FaceLandmarkDetectorMap.detectorMap[detectorHandle.toInt()] ?: return false
    val orientation = params["orientation"] as String
    val mappedOrientation = imageOrientation(orientation)
    mappedOrientation ?: return false

    val mpImage = MediaImageBuilder(frame.image).build()
    detector.detectLiveStream(mpImage, mappedOrientation)
    return true
  }

  private enum class PixelFormat {
    RGB,
    BGR,
    ARGB,
    RGBA,
    BGRA,
    ABGR;

    companion object {
      fun fromString(string: String): PixelFormat =
          when (string) {
            "rgb" -> RGB
            "rgba" -> RGBA
            "argb" -> ARGB
            "bgra" -> BGRA
            "bgr" -> BGR
            "abgr" -> ABGR
            else -> throw Error("Invalid PixelFormat! ($string)")
          }
    }
  }

  private enum class DataType {
    UINT8,
    FLOAT32;

    companion object {
      fun fromString(string: String): DataType =
          when (string) {
            "uint8" -> UINT8
            "float32" -> FLOAT32
            else -> throw Error("Invalid DataType! ($string)")
          }
    }
  }
}

private enum class Rotation(val degrees: Int) {
  Rotation0(0),
  Rotation90(90),
  Rotation180(180),
  Rotation270(270);

  companion object {
    fun fromString(value: String): Rotation =
        when (value) {
          "0deg" -> Rotation0
          "90deg" -> Rotation90
          "180deg" -> Rotation180
          "270deg" -> Rotation270
          else -> throw Error("Invalid rotation value! ($value)")
        }
  }
}