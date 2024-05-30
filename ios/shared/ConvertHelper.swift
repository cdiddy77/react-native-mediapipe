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
