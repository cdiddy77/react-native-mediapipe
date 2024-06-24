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
import com.reactnativemediapipe.shared.normalizedLandmarkToWritableMap
import com.reactnativemediapipe.shared.transformMatrixToWritableMap

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
