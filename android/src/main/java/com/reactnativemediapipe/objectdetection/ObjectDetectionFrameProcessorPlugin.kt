package com.reactnativemediapipe.objectdetection

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.mrousavy.camera.core.types.PixelFormat
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin

class ObjectDetectionFrameProcessorPlugin() : FrameProcessorPlugin() {

  companion object {
    private const val TAG = "ObjectDetectionFrameProcessorPlugin"
  }

  override fun callback(frame: Frame, params: MutableMap<String, Any>?): Any? {
    val detectorHandle: Double = params!!["detectorHandle"] as Double
    val detector = ObjectDetectorMap.detectorMap[detectorHandle.toInt()] ?: return false

    //    val mpImage = MediaImageBuilder(frame.image).build()
    //    detector.detectLivestreamFrame(mpImage,frame.orientation)
    val bitmap = imageToBitmap(frame.imageProxy)
    if (bitmap != null) {
      val rotated = rotateBitmap(bitmap, orientationToDegrees(frame.orientation).toFloat())
      val mpImage = BitmapImageBuilder(rotated).build()
      detector.detectLivestreamFrame(mpImage, frame.orientation)
    }
    return true
  }

  private var bitmapBuffer: Bitmap? = null
  private fun imageToBitmap(image: ImageProxy): Bitmap? {
    if (bitmapBuffer == null) {
      bitmapBuffer = Bitmap.createBitmap(image.width, image.height, Bitmap.Config.ARGB_8888)
    }
    bitmapBuffer?.let {
      val buffer = image.planes[0].buffer
      it.copyPixelsFromBuffer(buffer)
    }
    return bitmapBuffer
  }

  private fun rotateBitmap(source: Bitmap, angle: Float): Bitmap {
    val matrix = Matrix()
    matrix.postRotate(angle)
    return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
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
