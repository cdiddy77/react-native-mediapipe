import Foundation
import MediaPipeTasksVision
import React

func convertFldResultBundleToDictionary(_ resultBundle: FaceLandmarkDetectionResultBundle) -> [String: Any] {
  var map = [String: Any]()
  
  // Results
  let resultsArray = resultBundle.faceLandmarkDetectorResults.map { result -> [String: Any] in
    var resultMap = [String: Any]()
    resultMap["timestampMs"] = result?.timestampInMilliseconds
    
    
    let landmarks = result?.faceLandmarks.map { $0.map(normalizedLandmarkToDictionary) }
    let matrices = result?.facialTransformationMatrixes.map(transformMatrixToDictionary)
    let blendshapes = result?.faceBlendshapes.map(classificationsToDictionary)
    
    return [
      "faceLandmarks": landmarks ?? [],
      "faceBlendshapes": blendshapes ?? [],
      "facialTransformationMatrixes": matrices ?? []
    ]
  }
  map["results"] = resultsArray
  
  // Image properties
  map["inputImageHeight"] = resultBundle.size.height
  map["inputImageWidth"] = resultBundle.size.width
  //  map["inputImageRotation"] = resultBundle.
  map["inferenceTime"] = resultBundle.inferenceTime
  
  return map
}

// Converts NormalizedLandmark to a Dictionary
func normalizedLandmarkToDictionary(_ landmark: NormalizedLandmark) -> [String: Any] {
  var dict = [
    "x": landmark.x,
    "y": landmark.y,
    "z": landmark.z
  ]
  if let visibility = landmark.visibility {
    dict["visibility"] = visibility.floatValue
  }
  if let presence = landmark.presence {
    dict["presence"] = presence.floatValue
  }
  return dict
}

// Converts TransformMatrix to a Dictionary
func transformMatrixToDictionary(_ matrix: TransformMatrix) -> [String: Any] {
  var data = [Float]()
  for row in 0..<matrix.rows {
    for column in 0..<matrix.columns {
      data.append(matrix.value(atRow: row, column: column))
    }
  }
  return [
    "rows": matrix.rows,
    "columns": matrix.columns,
    "data": data
  ]
}

// Converts Classifications to a Dictionary
func classificationsToDictionary(_ classification: Classifications) -> [String: Any] {
  let categories = classification.categories.map {
    [
      "categoryName": $0.categoryName ?? "",
      "displayName": $0.displayName ?? "",
      "score": $0.score
    ]
  }
  var dict = [
    "headIndex": classification.headIndex,
    "categories": categories
  ] as [String : Any]
  if let headName = classification.headName {
    dict["headName"] = headName
  }
  return dict
}

func connectorsToArray(_ connections:[Connection]) ->[[String: Any]] {
  return connections.map {
    [
      "start": $0.start,
      "end": $0.end
    ]
  }
}

