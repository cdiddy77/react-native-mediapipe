package com.reactnativemediapipe.objectdetection

import android.graphics.RectF
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.tasks.components.containers.Category
import com.google.mediapipe.tasks.components.containers.Detection
import java.util.Optional

// Assuming simplified representations based on your descriptions
fun convertCategoryToWritableMap(category: Category): WritableMap {
  val map = Arguments.createMap()
  map.putDouble("score", category.score().toDouble())
  map.putInt("index", category.index())
  map.putString("categoryName", category.categoryName())
  map.putString("displayName", category.displayName())
  return map
}

fun convertDetectionToWritableMap(detection: Detection): WritableMap {
  val map = Arguments.createMap()
  val categoriesArray = Arguments.createArray()
  detection.categories().forEach { category ->
    categoriesArray.pushMap(convertCategoryToWritableMap(category))
  }

  val keypointsArray = Arguments.createArray()
  detection.keypoints().ifPresent { keypoints ->
    keypoints.forEach { keypoint ->
      val keypointMap = Arguments.createMap()
      keypointMap.putDouble("x", keypoint.x().toDouble())
      keypointMap.putDouble("y", keypoint.y().toDouble())
      keypoint.label().ifPresent { keypointMap.putString("label", it) }
      keypoint.score().ifPresent{ keypointMap.putDouble("score",it.toDouble()) }
      keypointsArray.pushMap(keypointMap)
    }
  }

  map.putArray("categories", categoriesArray)
  map.putMap("boundingBox", convertRectFToWritableMap(detection.boundingBox()))
  map.putArray("keypoints", keypointsArray)
  return map
}

fun convertRectFToWritableMap(rectF: RectF): WritableMap {
  val map = Arguments.createMap()
  map.putDouble("left", rectF.left.toDouble())
  map.putDouble("top", rectF.top.toDouble())
  map.putDouble("right", rectF.right.toDouble())
  map.putDouble("bottom", rectF.bottom.toDouble())
  return map
}

fun convertResultBundleToWritableMap(resultBundle: ObjectDetectorHelper.ResultBundle): WritableMap {
  val map = Arguments.createMap()
  val resultsArray = Arguments.createArray()

  resultBundle.results.forEach { result ->
    val resultMap = Arguments.createMap()
    resultMap.putDouble("timestampMs", result.timestampMs().toDouble())
    val detectionsArray = Arguments.createArray()
    result.detections().forEach { detection ->
      detectionsArray.pushMap(convertDetectionToWritableMap(detection))
    }
    resultMap.putArray("detections", detectionsArray)
    resultsArray.pushMap(resultMap)
  }

  map.putArray("results", resultsArray)
  map.putInt("inputImageHeight", resultBundle.inputImageHeight)
  map.putInt("inputImageWidth", resultBundle.inputImageWidth)
  map.putInt("inputImageRotation", resultBundle.inputImageRotation)
  map.putDouble("inferenceTime", resultBundle.inferenceTime.toDouble())
  return map
}
