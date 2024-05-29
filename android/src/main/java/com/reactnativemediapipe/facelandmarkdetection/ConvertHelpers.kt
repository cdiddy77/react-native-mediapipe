package com.reactnativemediapipe.facelandmarkdetection

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.tasks.components.containers.Category
import com.google.mediapipe.tasks.components.containers.Classifications
import com.google.mediapipe.tasks.components.containers.Connection
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.mrousavy.camera.core.types.Orientation

// Converts NormalizedLandmark to WritableMap
fun normalizedLandmarkToWritableMap(landmark: NormalizedLandmark): WritableMap {
  val map = WritableNativeMap()
  map.putDouble("x", landmark.x().toDouble())
  map.putDouble("y", landmark.y().toDouble())
  map.putDouble("z", landmark.z().toDouble())
  return map
}

// Converts TransformMatrix to WritableMap
fun transformMatrixToWritableMap(matrix: FloatArray): WritableMap {
  val map = WritableNativeMap()
  val dataArray = WritableNativeArray()

  for (value in matrix) {
    dataArray.pushDouble(value.toDouble())
  }

  map.putInt("rows", 4)
  map.putInt("columns", 4)
  map.putArray("data", dataArray)
  return map
}

// Converts Classifications to WritableMap
fun classificationsToWritableMap(classification: Classifications): WritableMap {
  val map = WritableNativeMap()
  val categoriesArray = WritableNativeArray()

  classification.categories().forEach { category ->
    val categoryMap = WritableNativeMap()
    categoryMap.putString("label", category.categoryName())
    categoryMap.putDouble("score", category.score().toDouble())
    categoriesArray.pushMap(categoryMap)
  }

  map.putInt("headIndex", classification.headIndex())
  classification.headName()?.let {
    map.putString("headName", it.toString())
  }
  map.putArray("categories", categoriesArray)
  return map
}

fun categoryListToWritableMap(classification: List<Category>): WritableMap {
  val map = WritableNativeMap()
  val categoriesArray = WritableNativeArray()

  classification.forEach { category ->
    val categoryMap = WritableNativeMap()
    categoryMap.putString("label", category.categoryName())
    categoryMap.putDouble("score", category.score().toDouble())
    categoriesArray.pushMap(categoryMap)
  }

  map.putArray("categories", categoriesArray)
  return map
}

fun convertResultBundleToWritableMap(resultBundle: FaceLandmarkDetectorHelper.ResultBundle): WritableMap {
  val map = Arguments.createMap()
  val resultsArray = Arguments.createArray()
  resultBundle.results.forEach { result ->
    resultsArray.pushMap(faceLandmarkerResultToWritableMap(result))
  }
  map.putArray("results", resultsArray)
  map.putInt("inputImageHeight", resultBundle.inputImageHeight)
  map.putInt("inputImageWidth", resultBundle.inputImageWidth)
  map.putInt("inputImageRotation", resultBundle.inputImageRotation)
  map.putDouble("inferenceTime", resultBundle.inferenceTime.toDouble())
  return map
}

fun faceLandmarkerResultToWritableMap(result: FaceLandmarkerResult): WritableMap {
  val resultMap = WritableNativeMap()
  val landmarksArray = WritableNativeArray()
  val blendshapesArray = WritableNativeArray()
  val matricesArray = WritableNativeArray()

  result.faceLandmarks().forEach { face ->
    val faceArray = WritableNativeArray()
    face.forEach { landmark -> faceArray.pushMap(normalizedLandmarkToWritableMap(landmark)) }
    landmarksArray.pushArray(faceArray)
  }

  result.faceBlendshapes().ifPresent { listOfListOfCategories ->
    // Iterate over the list of list of categories
    listOfListOfCategories.forEach { list ->
      // Convert each list of categories to a WritableMap
      val map: WritableMap = categoryListToWritableMap(list)
      // Push the WritableMap to the blendshapesArray
      blendshapesArray.pushMap(map)
    }
  }

  result.facialTransformationMatrixes().ifPresent { listOfMatrices ->
    listOfMatrices.forEach { matrix ->
      matricesArray.pushMap(transformMatrixToWritableMap(matrix))

    }
  }

  resultMap.putArray("faceLandmarks", landmarksArray)
  resultMap.putArray("faceBlendshapes", blendshapesArray)
  resultMap.putArray("facialTransformationMatrixes", matricesArray)

  return resultMap
}

fun orientationToDegrees(orientation: Orientation): Int =
  when (orientation) {
    Orientation.PORTRAIT -> 0
    Orientation.LANDSCAPE_LEFT -> 90
    Orientation.PORTRAIT_UPSIDE_DOWN -> 180
    Orientation.LANDSCAPE_RIGHT -> -90
  }


fun connectionSetToWritableArray(connections: Set<Connection>): WritableArray {
  val result = WritableNativeArray()
  connections.forEach {
    val map = Arguments.createMap()
    map.putInt("start", it.start())
    map.putInt("end", it.end())
    result.pushMap(map)
  }
  return result
}
