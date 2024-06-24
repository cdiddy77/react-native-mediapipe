import MediaPipeTasksVision

func convertIntToDelegate(_ value: Int) -> Delegate {
  switch value {
  case 0:
    return .CPU
  case 1:
    return .GPU
  default:
    return .CPU
  }
}

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

func landmarkToDictionary(_ landmark: Landmark) -> [String: Any] {
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

func maskToDictionary(_ mask: Mask) -> [String: Any] {
  var dictionary: [String: Any] = [
    "width": mask.width,
    "height": mask.height,
    "dataType": mask.dataType.rawValue
  ]
  
  switch mask.dataType {
  case .uInt8:
    let data = Array(UnsafeBufferPointer(start: mask.uint8Data, count: mask.width * mask.height))
    dictionary["uint8Data"] = data
  case .float32:
    let data = Array(UnsafeBufferPointer(start: mask.float32Data, count: mask.width * mask.height))
    dictionary["float32Data"] = data
  @unknown default:
    fatalError()
  }
  
  return dictionary
}

