//
//  PoseDetectionFrameProcessorPlugin.swift
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

import Foundation
import Vision

@objc(PoseDetectionFrameProcessorPlugin)
public class PoseDetectionFrameProcessorPlugin: FrameProcessorPlugin {
  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any
  {
    guard let detectorHandleValue = arguments?["detectorHandle"] as? Double else {
      return false
    }
    // get the orientation argument. If its nil, return false
    guard let orientation = arguments?["orientation"] as? String else {
      return false
    }
    // convert the orientation string to a UIImage.Orientation
    guard let uiOrientation = uiImageOrientation(from: orientation) else {
      return false
    }
    

    // Now that we have a valid Double, attempt to retrieve the detector using it
    guard let detector = PoseDetectionModule.detectorMap[Int(detectorHandleValue)] else {
      return false
    }

    let buffer = frame.buffer
    detector.detectAsync(
      sampleBuffer: buffer,
      orientation: uiOrientation,
      timeStamps: Int(Date().timeIntervalSince1970 * 1000))
    return true
  }
}
