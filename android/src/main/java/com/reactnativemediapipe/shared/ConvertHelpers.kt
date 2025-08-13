package com.reactnativemediapipe.shared

import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.mediapipe.tasks.components.containers.Landmark
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import com.mrousavy.camera.core.types.Orientation
import java.util.Optional

// Converts NormalizedLandmark to WritableMap
fun normalizedLandmarkToWritableMap(landmark: NormalizedLandmark): WritableMap {
  val map = WritableNativeMap()
  map.putDouble("x", landmark.x().toDouble())
  map.putDouble("y", landmark.y().toDouble())
  map.putDouble("z", landmark.z().toDouble())
  val visibility: Optional<Float> = landmark.visibility()
  if (visibility.isPresent) {
    map.putDouble("visibility", visibility.get().toDouble())
  }
  
  val presence: Optional<Float> = landmark.presence()
  if (presence.isPresent) {
    map.putDouble("presence", presence.get().toDouble())
  }
  return map
}

fun landmarkToWritableMap(landmark: Landmark): WritableMap {
  val map = WritableNativeMap()
  map.putDouble("x", landmark.x().toDouble())
  map.putDouble("y", landmark.y().toDouble())
  map.putDouble("z", landmark.z().toDouble())
  val visibility: Optional<Float> = landmark.visibility()
  if (visibility.isPresent) {
    map.putDouble("visibility", visibility.get().toDouble())
  }
  
  val presence: Optional<Float> = landmark.presence()
  if (presence.isPresent) {
    map.putDouble("presence", presence.get().toDouble())
  }
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

fun orientationToDegrees(orientation: Orientation): Int =
  when (orientation) {
    Orientation.PORTRAIT -> 0
    Orientation.LANDSCAPE_LEFT -> 90
    Orientation.PORTRAIT_UPSIDE_DOWN -> 180
    Orientation.LANDSCAPE_RIGHT -> -90
  }


