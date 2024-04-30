package com.reactnativemediapipe.shared

import android.media.Image
import androidx.annotation.Keep
import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import java.nio.ByteBuffer

class ResizeConvert {
  @DoNotStrip
  @Keep
  private val mHybridData: HybridData
  init {
    mHybridData = initHybrid()
  }
  private external fun initHybrid(): HybridData

  companion object {
        // Load the native library once, shared by all instances
        init {
            System.loadLibrary("ResizeConvertLib")
        }
    }

    // Native methods are instance methods now
    external fun resize(
      image: Image,
      cropX: Int,
      cropY: Int,
      cropWidth: Int,
      cropHeight: Int,
      scaleWidth: Int,
      scaleHeight: Int,
      rotationDegrees: Int,
      mirror: Boolean,
      pixelFormat: Int,
      dataType: Int
    ): ByteBuffer
}
