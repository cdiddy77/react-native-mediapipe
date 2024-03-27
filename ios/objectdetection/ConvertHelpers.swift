import Foundation
import MediaPipeTasksVision
import React

// Convert Category to NSDictionary
func convertCategoryToDictionary(_ category: ResultCategory) -> [String: Any] {
  var map = [String: Any]()
  map["score"] = category.score
  map["index"] = category.index
  map["categoryName"] = category.categoryName
  map["displayName"] = category.displayName
  return map
}

// Convert Detection to NSDictionary
func convertDetectionToDictionary(_ detection: Detection) -> [String: Any] {
  var map = [String: Any]()
  
  // Categories
  let categoriesArray = detection.categories.map { convertCategoryToDictionary($0) }
  map["categories"] = categoriesArray
  
  // Keypoints
  let keypointsArray = detection.keypoints?.compactMap { keypoint -> [String: Any]? in
    var keypointMap = [String: Any]()
    keypointMap["x"] = keypoint.location.x
    keypointMap["y"] = keypoint.location.y
    
    keypointMap["label"] = keypoint.label
    keypointMap["score"] = keypoint.score
    return keypointMap
  }
  map["keypoints"] = keypointsArray
  map["boundingBox"] = convertRectFToDictionary(detection.boundingBox)
  
  return map
}

// Convert RectF to NSDictionary
func convertRectFToDictionary(_ rectF: CGRect) -> [String: Any] {
  return [
    "left": rectF.minX,
    "top": rectF.minY,
    "right": rectF.maxX,
    "bottom": rectF.maxY
  ]
}

// Convert ResultBundle to NSDictionary
func convertResultBundleToDictionary(_ resultBundle: ResultBundle) -> [String: Any] {
  var map = [String: Any]()
  
  // Results
  let resultsArray = resultBundle.objectDetectorResults.map { result -> [String: Any] in
    var resultMap = [String: Any]()
    resultMap["timestampMs"] = result?.timestampInMilliseconds
    
    // Detections
    let detectionsArray = result?.detections.map { convertDetectionToDictionary($0) }
    resultMap["detections"] = detectionsArray
    return resultMap
  }
  map["results"] = resultsArray
  
  // Image properties
  map["inputImageHeight"] = resultBundle.size.height
  map["inputImageWidth"] = resultBundle.size.width
//  map["inputImageRotation"] = resultBundle.
  map["inferenceTime"] = resultBundle.inferenceTime
  
  return map
}
