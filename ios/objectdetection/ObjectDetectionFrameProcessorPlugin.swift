//
//  ObjectDetectionFrameProcessorPlugin.swift
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

import Foundation
import Vision


@objc(ObjectDetectionFrameProcessorPlugin)
public class ObjectDetectionFrameProcessorPlugin: FrameProcessorPlugin {
  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any
  {
    let detectorHandle: Double = arguments?["detectorHandle"] as! Double
    guard let detector = ObjectDetectionModule.detectorMap[Int(detectorHandle)] else {
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
