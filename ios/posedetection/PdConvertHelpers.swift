import Foundation
import MediaPipeTasksVision
import React

func convertPdResultBundleToDictionary(_ resultBundle: PoseDetectionResultBundle) -> [String: Any] {
  var map = [String: Any]()
  
  // Results
  let resultsArray = resultBundle.poseDetectorResults.map { result -> [String: Any] in
    var resultMap = [String: Any]()
    resultMap["timestampMs"] = result?.timestampInMilliseconds
    
    
    let landmarks = result?.landmarks.map { $0.map(normalizedLandmarkToDictionary) }
    let worldLandmarks = result?.worldLandmarks.map { $0.map(landmarkToDictionary) }
    // this is typically a float for every frame. Too much. It can never go over the boundary
//    let segmentationMasks = result?.segmentationMasks.map { maskToDictionary($0) }
    
    return [
      "landmarks": landmarks ?? [],
      "worldLandmarks": worldLandmarks ?? [],
      "segmentationMasks": []
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

