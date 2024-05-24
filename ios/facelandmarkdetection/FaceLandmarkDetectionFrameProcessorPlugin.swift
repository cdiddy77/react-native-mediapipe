//
//  FaceLandmarkDetectionFrameProcessorPlugin.swift
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

import Foundation
import Vision

@objc(FaceLandmarkDetectionFrameProcessorPlugin)
public class FaceLandmarkDetectionFrameProcessorPlugin: FrameProcessorPlugin {
  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any
  {
    guard let detectorHandleValue = arguments?["detectorHandle"] as? Double else {
      return false
    }

    // Now that we have a valid Double, attempt to retrieve the detector using it
    guard let detector = FaceLandmarkDetectionModule.detectorMap[Int(detectorHandleValue)] else {
      return false
    }

    let buffer = frame.buffer
    detector.detectAsync(
      sampleBuffer: buffer,
      orientation: frame.orientation,
      timeStamps: Int(Date().timeIntervalSince1970 * 1000))
    return true
  }
}
