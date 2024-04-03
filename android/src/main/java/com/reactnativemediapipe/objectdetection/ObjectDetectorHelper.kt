package com.reactnativemediapipe.objectdetection

import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.media.Image
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.SystemClock
import android.renderscript.Allocation
import android.renderscript.Element
import android.renderscript.RenderScript
import android.renderscript.ScriptIntrinsicYuvToRGB
import android.renderscript.Type
import android.util.Log
import androidx.core.math.MathUtils.clamp
import com.facebook.react.common.annotations.VisibleForTesting
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.ImageProcessingOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetectorResult


class ObjectDetectorHelper(
  var threshold: Float = THRESHOLD_DEFAULT,
  var maxResults: Int = MAX_RESULTS_DEFAULT,
  var currentDelegate: Int = DELEGATE_CPU,
  var currentModel: String,
  var runningMode: RunningMode = RunningMode.IMAGE,
  val context: Context,
  // The listener is only used when running in RunningMode.LIVE_STREAM
  var objectDetectorListener: DetectorListener? = null
) {

  // For this example this needs to be a var so it can be reset on changes. If the ObjectDetector
  // will not change, a lazy val would be preferable.
  private var objectDetector: ObjectDetector? = null
  private var imageRotation = 0
  private lateinit var imageProcessingOptions: ImageProcessingOptions

  init {
    setupObjectDetector()
  }

  fun clearObjectDetector() {
    objectDetectorListener = null
    objectDetector?.close()
    objectDetector = null
  }

  // Initialize the object detector using current settings on the
  // thread that is using it. CPU can be used with detectors
  // that are created on the main thread and used on a background thread, but
  // the GPU delegate needs to be used on the thread that initialized the detector
  private fun setupObjectDetector() {
    // Set general detection options, including number of used threads
    val baseOptionsBuilder = BaseOptions.builder()

    // Use the specified hardware for running the model. Default to CPU
    when (currentDelegate) {
      DELEGATE_CPU -> {
        baseOptionsBuilder.setDelegate(Delegate.CPU)
      }

      DELEGATE_GPU -> {
        // Is there a check for GPU being supported?
        baseOptionsBuilder.setDelegate(Delegate.GPU)
      }
    }

    baseOptionsBuilder.setModelAssetPath(currentModel)

    // Check if runningMode is consistent with objectDetectorListener
    when (runningMode) {
      RunningMode.LIVE_STREAM -> {
        if (objectDetectorListener == null) {
          throw IllegalStateException(
            "objectDetectorListener must be set when runningMode is LIVE_STREAM."
          )
        }
      }

      RunningMode.IMAGE, RunningMode.VIDEO -> {
        // no-op
      }
    }

    try {
      val optionsBuilder = ObjectDetector.ObjectDetectorOptions.builder()
        .setBaseOptions(baseOptionsBuilder.build())
        .setScoreThreshold(threshold).setRunningMode(runningMode)
        .setMaxResults(maxResults)

      imageProcessingOptions = ImageProcessingOptions.builder()
        .setRotationDegrees(imageRotation).build()

      when (runningMode) {
        RunningMode.IMAGE, RunningMode.VIDEO -> optionsBuilder.setRunningMode(
          runningMode
        )

        RunningMode.LIVE_STREAM -> optionsBuilder.setRunningMode(
          runningMode
        ).setResultListener(this::returnLivestreamResult)
          .setErrorListener(this::returnLivestreamError)
      }

      val options = optionsBuilder.build()
      objectDetector = ObjectDetector.createFromOptions(context, options)
    } catch (e: IllegalStateException) {
      objectDetectorListener?.onError(
        "Object detector failed to initialize: " + e.message
      )
      Log.e(TAG, "TFLite failed to load model with error: " + e.message)
    } catch (e: RuntimeException) {
      objectDetectorListener?.onError(
        "Object detector failed to initialize: " + e.message
      )
      Log.e(
        TAG,
        "Object detector failed to load model with error: " + e.message
      )
    } catch (e: Exception) {
      objectDetectorListener?.onError(
        "Object detector failed to initialize: " + e.message
      )
      Log.e(TAG, "TFLite failed to load model with error: " + e.message)
    }
  }

  // Return running status of recognizer helper
  fun isClosed(): Boolean {
    return objectDetector == null
  }


  private fun yuv420ToBitmapRS(image: Image, context: Context?): Bitmap? {
    val rs = RenderScript.create(context)
    val script = ScriptIntrinsicYuvToRGB.create(
      rs, Element.U8_4(rs)
    )

    // Refer the logic in a section below on how to convert a YUV_420_888 image
    // to single channel flat 1D array. For sake of this example I'll abstract it
    // as a method.
//    val yuvByteArray: ByteArray = yuv420ToByteArray(image)
    val planes = image.planes
    val yPlane = planes[0].buffer
    val uPlane = planes[1].buffer
    val vPlane = planes[2].buffer

    val ySize = yPlane.remaining()
    val uSize = uPlane.remaining()
    val vSize = vPlane.remaining()

    // Assuming YUV_420_888 format, which means chroma planes have half the width and height of the luma plane.
    val width = image.width
    val height = image.height

    // Temporary storage for the YUV data
    val yuvBytes = ByteArray(ySize + uSize + vSize)

    // Copy the YUV data into yuvBytes
    yPlane.get(yuvBytes, 0, ySize)
    uPlane.get(yuvBytes, ySize, uSize)
    vPlane.get(yuvBytes, ySize + uSize, vSize)

    val yuvType: Type.Builder = Type.Builder(rs, Element.U8(rs))
      .setX(yuvBytes.size)
    val `in` = Allocation.createTyped(
      rs, yuvType.create(), Allocation.USAGE_SCRIPT
    )
    val rgbaType: Type.Builder = Type.Builder(rs, Element.RGBA_8888(rs))
      .setX(image.width)
      .setY(image.height)
    val out = Allocation.createTyped(
      rs, rgbaType.create(), Allocation.USAGE_SCRIPT
    )

    if (image.format != ImageFormat.YUV_420_888) {
      throw IllegalArgumentException("Only YUV_420_888 format can be processed.")
    }

    // The allocations above "should" be cached if you are going to perform
    // repeated conversion of YUV_420_888 to Bitmap.
    `in`.copyFrom(yuvBytes)
    script.setInput(`in`)
    script.forEach(out)
    val bitmap = Bitmap.createBitmap(
      image.width, image.height, Bitmap.Config.ARGB_8888
    )
    out.copyTo(bitmap)
    return bitmap
  }

  private fun yuv420ToBitmap(image: Image): Bitmap? {
    require(image.format == ImageFormat.YUV_420_888) { "Invalid image format" }
    val imageWidth = image.width
    val imageHeight = image.height
    // ARGB array needed by Bitmap static factory method I use below.
    val argbArray = IntArray(imageWidth * imageHeight)
    val yBuffer = image.planes[0].buffer
    yBuffer.position(0)

    // A YUV Image could be implemented with planar or semi planar layout.
    // A planar YUV image would have following structure:
    // YYYYYYYYYYYYYYYY
    // ................
    // UUUUUUUU
    // ........
    // VVVVVVVV
    // ........
    //
    // While a semi-planar YUV image would have layout like this:
    // YYYYYYYYYYYYYYYY
    // ................
    // UVUVUVUVUVUVUVUV   <-- Interleaved UV channel
    // ................
    // This is defined by row stride and pixel strides in the planes of the
    // image.

    // Plane 1 is always U & plane 2 is always V
    // https://developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888
    val uBuffer = image.planes[1].buffer
    uBuffer.position(0)
    val vBuffer = image.planes[2].buffer
    vBuffer.position(0)

    // The U/V planes are guaranteed to have the same row stride and pixel
    // stride.
    val yRowStride = image.planes[0].rowStride
    val yPixelStride = image.planes[0].pixelStride
    val uvRowStride = image.planes[1].rowStride
    val uvPixelStride = image.planes[1].pixelStride
    var r: Int
    var g: Int
    var b: Int
    var yValue: Int
    var uValue: Int
    var vValue: Int
    for (y in 0 until imageHeight) {
      for (x in 0 until imageWidth) {
        val yIndex = y * yRowStride + x * yPixelStride
        // Y plane should have positive values belonging to [0...255]
        yValue = yBuffer[yIndex].toInt() and 0xff
        val uvx = x / 2
        val uvy = y / 2
        // U/V Values are subsampled i.e. each pixel in U/V chanel in a
        // YUV_420 image act as chroma value for 4 neighbouring pixels
        val uvIndex = uvy * uvRowStride + uvx * uvPixelStride

        // U/V values ideally fall under [-0.5, 0.5] range. To fit them into
        // [0, 255] range they are scaled up and centered to 128.
        // Operation below brings U/V values to [-128, 127].
        uValue = (uBuffer[uvIndex].toInt() and 0xff) - 128
        vValue = (vBuffer[uvIndex].toInt() and 0xff) - 128

        // Compute RGB values per formula above.
        r = (yValue + 1.370705f * vValue).toInt()
        g = (yValue - 0.698001f * vValue - 0.337633f * uValue).toInt()
        b = (yValue + 1.732446f * uValue).toInt()
        r = clamp(r, 0, 255)
        g = clamp(g, 0, 255)
        b = clamp(b, 0, 255)

        // Use 255 for alpha value, no transparency. ARGB values are
        // positioned in each byte of a single 4 byte integer
        // [AAAAAAAARRRRRRRRGGGGGGGGBBBBBBBB]
        val argbIndex = y * imageWidth + x
        argbArray[argbIndex] = 255 shl 24 or (r and 255 shl 16) or (g and 255 shl 8) or (b and 255)
      }
    }
    if (argbArray.size != imageHeight * imageWidth) {
      throw IllegalArgumentException("Byte array length must be a multiple of 4")
    }
    val bitmap = Bitmap.createBitmap(imageWidth, imageHeight, Bitmap.Config.ARGB_8888)
    bitmap.setPixels(argbArray, 0, imageWidth, 0, 0, imageWidth, imageHeight)
    return bitmap
  }

//  private fun toBitmap(image: Image): Bitmap? {
//    try {
//      return yuv420ToBitmap(image)
//
////      val planes = image.planes
////      val buffer = planes[0].buffer
////      val pixelStride = planes[0].pixelStride
////      val rowStride = planes[0].rowStride
////      val rowPadding = rowStride - pixelStride * image.width
////      val bitmap = Bitmap.createBitmap(
////        image.width + rowPadding / pixelStride,
////        image.height, Bitmap.Config.ARGB_8888
////      )
////      bitmap.copyPixelsFromBuffer(buffer)
////      return bitmap
//    } catch (e: Exception) {
//      objectDetectorListener?.onError(error = e.toString(), code = 666)
//
//    }
//  }

  // Accepts the URI for a video file loaded from the user's gallery and attempts to run
  // object detection inference on the video. This process will evaluate every frame in
  // the video and attach the results to a bundle that will be returned.
  fun detectVideoFile(
    videoUri: Uri, inferenceIntervalMs: Long
  ): ResultBundle? {

    if (runningMode != RunningMode.VIDEO) {
      throw IllegalArgumentException(
        "Attempting to call detectVideoFile" + " while not using RunningMode.VIDEO"
      )
    }

    if (objectDetector == null) return null

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    var didErrorOccurred = false

    // Load frames from the video and run the object detection model.
    val retriever = MediaMetadataRetriever()
    retriever.setDataSource(context, videoUri)
    val videoLengthMs =
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        ?.toLong()

    // Note: We need to read width/height from frame instead of getting the width/height
    // of the video directly because MediaRetriever returns frames that are smaller than the
    // actual dimension of the video file.
    val firstFrame = retriever.getFrameAtTime(0)
    val width = firstFrame?.width
    val height = firstFrame?.height

    // If the video is invalid, returns a null detection result
    if ((videoLengthMs == null) || (width == null) || (height == null)) return null

    // Next, we'll get one frame every frameInterval ms, then run detection on these frames.
    val resultList = mutableListOf<ObjectDetectorResult>()
    val numberOfFrameToRead = videoLengthMs.div(inferenceIntervalMs)

    for (i in 0..numberOfFrameToRead) {
      val timestampMs = i * inferenceIntervalMs // ms

      retriever.getFrameAtTime(
        timestampMs * 1000, // convert from ms to micro-s
        MediaMetadataRetriever.OPTION_CLOSEST
      )?.let { frame ->
        // Convert the video frame to ARGB_8888 which is required by the MediaPipe
        val argb8888Frame =
          if (frame.config == Bitmap.Config.ARGB_8888) frame
          else frame.copy(Bitmap.Config.ARGB_8888, false)

        // Convert the input Bitmap object to an MPImage object to run inference
        val mpImage = BitmapImageBuilder(argb8888Frame).build()

        // Run object detection using MediaPipe Object Detector API
        objectDetector?.detectForVideo(mpImage, timestampMs)
          ?.let { detectionResult ->
            resultList.add(detectionResult)
          } ?: {
          didErrorOccurred = true
          objectDetectorListener?.onError(
            "ResultBundle could not be returned" + " in detectVideoFile"
          )
        }
      } ?: run {
        didErrorOccurred = true
        objectDetectorListener?.onError(
          "Frame at specified time could not be" + " retrieved when detecting in video."
        )
      }
    }

    retriever.release()

    val inferenceTimePerFrameMs =
      (SystemClock.uptimeMillis() - startTime).div(numberOfFrameToRead)

    return if (didErrorOccurred) {
      null
    } else {
      ResultBundle(resultList, inferenceTimePerFrameMs, height, width)
    }
  }

  // Runs object detection on live streaming cameras frame-by-frame and returns the results
  // asynchronously to the caller.
  fun detectLivestreamFrame(image: Image) {

    if (runningMode != RunningMode.LIVE_STREAM) {
      throw IllegalArgumentException(
        "Attempting to call detectLivestreamFrame" + " while not using RunningMode.LIVE_STREAM"
      )
    }

    val frameTime = SystemClock.uptimeMillis()

    // Convert the input Bitmap object to an MPImage object to run inference
//    val bitmap = toBitmap(image)
//    val bitmap = yuv420ToBitmap(image)
    val bitmap = yuv420ToBitmapRS(image,context)
//    val mpImage = MediaImageBuilder(image).build()
    val mpImage = BitmapImageBuilder(bitmap).build()

    detectAsync(mpImage, frameTime)
  }

  // Run object detection using MediaPipe Object Detector API
  @VisibleForTesting
  fun detectAsync(mpImage: MPImage, frameTime: Long) {
    // As we're using running mode LIVE_STREAM, the detection result will be returned in
    // returnLivestreamResult function
    objectDetector?.detectAsync(mpImage, imageProcessingOptions, frameTime)
  }

  // Return the detection result to this ObjectDetectorHelper's caller
  private fun returnLivestreamResult(
    result: ObjectDetectorResult, input: MPImage
  ) {
    val finishTimeMs = SystemClock.uptimeMillis()
    val inferenceTime = finishTimeMs - result.timestampMs()

    objectDetectorListener?.onResults(
      ResultBundle(
        listOf(result),
        inferenceTime,
        input.height,
        input.width,
        imageRotation
      )
    )
  }

  // Return errors thrown during detection to this ObjectDetectorHelper's caller
  private fun returnLivestreamError(error: RuntimeException) {
    objectDetectorListener?.onError(
      error.message ?: "An unknown error has occurred"
    )
  }

  // Accepted a Bitmap and runs object detection inference on it to return results back
  // to the caller
  fun detectImage(image: Bitmap): ResultBundle? {

    if (runningMode != RunningMode.IMAGE) {
      throw IllegalArgumentException(
        "Attempting to call detectImage" + " while not using RunningMode.IMAGE"
      )
    }

    if (objectDetector == null) return null

    // Inference time is the difference between the system time at the start and finish of the
    // process
    val startTime = SystemClock.uptimeMillis()

    // Convert the input Bitmap object to an MPImage object to run inference
    val mpImage = BitmapImageBuilder(image).build()

    // Run object detection using MediaPipe Object Detector API
    objectDetector?.detect(mpImage)?.also { detectionResult ->
      val inferenceTimeMs = SystemClock.uptimeMillis() - startTime
      return ResultBundle(
        listOf(detectionResult),
        inferenceTimeMs,
        image.height,
        image.width
      )
    }

    // If objectDetector?.detect() returns null, this is likely an error. Returning null
    // to indicate this.
    return null
  }

  // Wraps results from inference, the time it takes for inference to be performed, and
  // the input image and height for properly scaling UI to return back to callers
  data class ResultBundle(
    val results: List<ObjectDetectorResult>,
    val inferenceTime: Long,
    val inputImageHeight: Int,
    val inputImageWidth: Int,
    val inputImageRotation: Int = 0
  )

  companion object {
    const val DELEGATE_CPU = 0
    const val DELEGATE_GPU = 1

    const val MAX_RESULTS_DEFAULT = 3
    const val THRESHOLD_DEFAULT = 0.5F
    const val OTHER_ERROR = 0
    const val GPU_ERROR = 1

    const val TAG = "ObjectDetectorHelper"
  }

  // Used to pass results or errors back to the calling class
  interface DetectorListener {
    fun onError(error: String, errorCode: Int = OTHER_ERROR)
    fun onResults(resultBundle: ResultBundle)
  }
}
