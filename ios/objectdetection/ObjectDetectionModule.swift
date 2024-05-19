//
//  ObjectDetectionModule.swift
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

import Foundation
import React
import MediaPipeTasksVision

@objc(ObjectDetectionModule)
class ObjectDetectionModule: RCTEventEmitter {
  private static var nextId = 22 // Equivalent to Kotlin's starting point
  static var detectorMap = [Int: ObjectDetectorHelper]() // Maps to the Kotlin detectorMap
  
  override func supportedEvents() -> [String]! {
    return ["onResults","onError"]
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc func createDetector(_ threshold: NSNumber,
                            withMaxResults maxResults: NSInteger,
                            withDelegate delegate: NSInteger,
                            withModel model: String,
                            withRunningMode runningMode: NSInteger,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    let id = ObjectDetectionModule.nextId
    ObjectDetectionModule.nextId += 1
    
    // Convert runningMode to RunningMode enum
    guard let mode = RunningMode(rawValue: UInt(runningMode)) else {
      reject("E_MODE_ERROR", "Invalid running mode", nil)
      return
    }
    
    do {
      let helper = try ObjectDetectorHelper(
        handle:id,
        scoreThreshold: threshold.floatValue,
        maxResults: maxResults,
        modelName: model,
        runningMode: mode)
      helper.delegate = self // Assuming `self` conforms to `ObjectDetectorHelperDelegate`
      
      ObjectDetectionModule.detectorMap[id] = helper
      resolve(id)
    } catch let error as NSError {
      // If an error is thrown, reject the promise
      // You can customize the error code and message as needed
      reject("ERROR_CODE", "An error occurred: \(error.localizedDescription)", error)
    }
  }
  
  @objc func releaseDetector(_ handle: NSInteger,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    if ObjectDetectionModule.detectorMap.removeValue(forKey: handle) != nil {
      resolve(true)
    } else {
      resolve(false)
    }
  }
  
  @objc func detectOnImage(_ imagePath: String,
                           withThreshold threshold: NSNumber,
                           withMaxResults maxResults: NSInteger,
                           withDelegate delegate: NSInteger,
                           withModel model: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      let helper = try ObjectDetectorHelper(
        handle: 0,
        scoreThreshold: threshold.floatValue,
        maxResults: maxResults,
        modelName: model,
        runningMode: RunningMode.image)
      helper.delegate = self // Assuming `self` conforms to `ObjectDetectorHelperDelegate`

      // convert path to UIImage
      let image = try loadImageFromPath(from: imagePath)
      if let result = helper.detect(image: image) {
        let resultArgs = convertResultBundleToDictionary(result)
        resolve(resultArgs)
      } else {
        throw NSError(domain: "com.objectdetection.error", code: 1001, userInfo: [NSLocalizedDescriptionKey: "Detection failed."])
      }
    } catch let error as NSError {
      // If an error is thrown, reject the promise
      // You can customize the error code and message as needed
      reject("ERROR_CODE", "An error occurred: \(error.localizedDescription)", error)
    }
  }

  
  // MARK: Event Emission Helpers
  private func sendErrorEvent(handle: Int, message: String, code: Int) {
    self.sendEvent(withName: "onError", body: ["handle": handle, "message": message, "code": code])
  }
  
  private func sendResultsEvent(handle: Int, bundle: ResultBundle) {
    // Assuming convertResultBundleToDictionary exists and converts ResultBundle to a suitable dictionary
    var resultArgs = convertResultBundleToDictionary(bundle)
    resultArgs["handle"] = handle
    self.sendEvent(withName: "onResults", body: resultArgs)
  }
}

extension ObjectDetectionModule: ObjectDetectorHelperDelegate {
  func objectDetectorHelper(_ objectDetectorHelper: ObjectDetectorHelper, onResults result: ResultBundle?, error: Error?) {
    if let result = result {
      sendResultsEvent(handle: objectDetectorHelper.handle, bundle: result)
    } else if let error = error as? NSError {
      sendErrorEvent(handle: objectDetectorHelper.handle, message: error.localizedDescription, code: error.code)
    }
  }
}
