package com.reactnativemediapipe.objectdetection

import android.graphics.ImageFormat
import android.util.Log
import com.google.mediapipe.framework.image.ByteBufferImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessor.VisionCameraProxy
import com.reactnativemediapipe.shared.ResizeConvert

class ObjectDetectionFrameProcessorPlugin() :
  FrameProcessorPlugin() {

  companion object {
    private const val TAG = "ObjectDetectionFrameProcessorPlugin"
  }
  private val resizeConvert: ResizeConvert = ResizeConvert()

  override fun callback(frame: Frame, params: MutableMap<String, Any>?): Any? {
    val detectorHandle: Double = params!!["detectorHandle"] as Double
    val detector = ObjectDetectorMap.detectorMap[detectorHandle.toInt()] ?: return false

    var cropWidth = frame.width
    var cropHeight = frame.height
    var cropX = 0
    var cropY = 0
    var scaleWidth = frame.width
    var scaleHeight = frame.height

    val rotationParam = params["rotation"]
    val rotation: Rotation
    if (rotationParam is String) {
      rotation = Rotation.fromString(rotationParam)
      Log.i(TAG, "Rotation: ${rotation.degrees}")
    } else {
      rotation = Rotation.Rotation0
      Log.i(TAG, "Rotation not specified, defaulting to: ${rotation.degrees}")
    }

    val mirrorParam = params["mirror"]
    val mirror: Boolean
    if (mirrorParam is Boolean) {
      mirror = mirrorParam
      Log.i(TAG, "Mirror: $mirror")
    } else {
      mirror = false
      Log.i(TAG, "Mirror not specified, defaulting to: $mirror")
    }

    val scale = params["scale"]
    if (scale != null) {
      if (scale is Map<*, *>) {
        val scaleWidthDouble = scale["width"] as? Double
        val scaleHeightDouble = scale["height"] as? Double
        if (scaleWidthDouble != null && scaleHeightDouble != null) {
          scaleWidth = scaleWidthDouble.toInt()
          scaleHeight = scaleHeightDouble.toInt()
        } else {
          throw Error("Failed to parse values in scale dictionary!")
        }
        Log.i(TAG, "Target scale: $scaleWidth x $scaleHeight")
      } else if (scale is Double) {
        scaleWidth = (scale * frame.width).toInt()
        scaleHeight = (scale * frame.height).toInt()
        Log.i(TAG, "Uniform scale factor applied: $scaleWidth x $scaleHeight")
      } else {
        throw Error("Scale must be either a map with width and height or a double value!")
      }
    }

    val crop = params["crop"] as? Map<*, *>
    if (crop != null) {
      val cropWidthDouble = crop["width"] as? Double
      val cropHeightDouble = crop["height"] as? Double
      val cropXDouble = crop["x"] as? Double
      val cropYDouble = crop["y"] as? Double
      if (cropWidthDouble != null && cropHeightDouble != null && cropXDouble != null && cropYDouble != null) {
        cropWidth = cropWidthDouble.toInt()
        cropHeight = cropHeightDouble.toInt()
        cropX = cropXDouble.toInt()
        cropY = cropYDouble.toInt()
        Log.i(TAG, "Target size: $cropWidth x $cropHeight")
      } else {
        throw Error("Failed to parse values in crop dictionary!")
      }
    } else {
      if (scale != null) {
        val aspectRatio = frame.width.toDouble() / frame.height.toDouble()
        val targetAspectRatio = scaleWidth.toDouble() / scaleHeight.toDouble()

        if (aspectRatio > targetAspectRatio) {
          cropWidth = (frame.height * targetAspectRatio).toInt()
          cropHeight = frame.height
        } else {
          cropWidth = frame.width
          cropHeight = (frame.width / targetAspectRatio).toInt()
        }
        cropX = (frame.width / 2) - (cropWidth / 2)
        cropY = (frame.height / 2) - (cropHeight / 2)
        Log.i(TAG, "Cropping to $cropWidth x $cropHeight at ($cropX, $cropY)")
      } else {
        Log.i(TAG, "Both scale and crop are null, using Frame's original dimensions.")
      }
    }

    val image = frame.image

    if (image.format != ImageFormat.YUV_420_888) {
      throw Error("Frame has invalid PixelFormat! Only YUV_420_888 is supported. Did you set pixelFormat=\"yuv\"?")
    }

    val resized = resizeConvert.resize(
      image,
      cropX, cropY,
      cropWidth, cropHeight,
      scaleWidth, scaleHeight,
      rotation.degrees,
      mirror,
      PixelFormat.RGB.ordinal,
      DataType.UINT8.ordinal
    )

    val mpImage =
      ByteBufferImageBuilder(resized, scaleWidth, scaleHeight, MPImage.IMAGE_FORMAT_RGB).build()

    detector.detectLivestreamFrame(mpImage)
    return true
  }

  private enum class PixelFormat {
    // Integer-Values (ordinals) to be in sync with ResizePlugin.h
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
    // Integer-Values (ordinals) to be in sync with ResizePlugin.h
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
