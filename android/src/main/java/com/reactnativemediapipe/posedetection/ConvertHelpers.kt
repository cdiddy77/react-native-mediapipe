package com.reactnativemediapipe.posedetection

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.reactnativemediapipe.shared.landmarkToWritableMap
import com.reactnativemediapipe.shared.normalizedLandmarkToWritableMap


fun convertResultBundleToWritableMap(resultBundle: PoseDetectorHelper.ResultBundle): WritableMap {
  val map = Arguments.createMap()
  val resultsArray = Arguments.createArray()
  resultBundle.results.forEach { result ->
    resultsArray.pushMap(poseLandmarkerResultToWritableMap(result))
  }
  map.putArray("results", resultsArray)
  map.putInt("inputImageHeight", resultBundle.inputImageHeight)
  map.putInt("inputImageWidth", resultBundle.inputImageWidth)
  map.putDouble("inferenceTime", resultBundle.inferenceTime.toDouble())
  return map
}

fun poseLandmarkerResultToWritableMap(result: PoseLandmarkerResult): WritableMap {
  val resultMap = WritableNativeMap()
  val landmarksArray = WritableNativeArray()
  val worldLandmarksArray = WritableNativeArray()
  result.landmarks().forEach { landmarks ->
    val landmarkArray = WritableNativeArray()
    landmarks.forEach { it -> landmarkArray.pushMap(normalizedLandmarkToWritableMap(it)) }
    landmarksArray.pushArray(landmarkArray)
  }

  result.worldLandmarks().forEach { worldLandmarks ->
    val worldLandmarkArray = WritableNativeArray()
    worldLandmarks.forEach { it -> worldLandmarkArray.pushMap(landmarkToWritableMap(it)) }
    worldLandmarksArray.pushArray(worldLandmarkArray)
  }


  resultMap.putArray("landmarks", landmarksArray)
  resultMap.putArray("worldLandmarks", worldLandmarksArray)
  resultMap.putArray("segmentationMask", WritableNativeArray())

  return resultMap
}
