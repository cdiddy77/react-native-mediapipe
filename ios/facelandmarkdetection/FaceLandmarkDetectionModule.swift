//
//  FaceLandmarkDetectionModule.swift
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

import Foundation
import MediaPipeTasksVision
import React

@objc(FaceLandmarkDetectionModule)
class FaceLandmarkDetectionModule: RCTEventEmitter {
  private static var nextId = 24  // Equivalent to Kotlin's starting point
  static var detectorMap = [Int: FaceLandmarkDetectorHelper]()  // Maps to the Kotlin detectorMap

  override func supportedEvents() -> [String]! {
    return ["onResults", "onError"]
  }

  @objc override func constantsToExport() -> [AnyHashable: Any] {
    return [
      "knownLandmarks": [
        "lips": connectorsToArray(FaceLandmarker.lipsConnections()),
        "leftEye": connectorsToArray(FaceLandmarker.leftEyeConnections()),
        "leftEyebrow": connectorsToArray(FaceLandmarker.leftEyebrowConnections()),
        "leftIris": connectorsToArray(FaceLandmarker.leftIrisConnections()),
        "rightEye": connectorsToArray(FaceLandmarker.rightEyeConnections()),
        "rightEyebrow": connectorsToArray(FaceLandmarker.rightEyebrowConnections()),
        "rightIris": connectorsToArray(FaceLandmarker.rightIrisConnections()),
        "faceOval": connectorsToArray(FaceLandmarker.faceOvalConnections()),
        "connectors": connectorsToArray(FaceLandmarker.contoursConnections()),
        "tesselation": connectorsToArray(FaceLandmarker.tesselationConnections()),
      ]
    ]
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func createDetector(
    _ numFaces: NSInteger,
    withMinFaceDetectionConfidence minFaceDetectionConfidence: NSNumber,
    withMinFacePresenceConfidence minFacePresenceConfidence: NSNumber,
    withMinTrackingConfidence minTrackingConfidence: NSNumber,
    withModel model: String,
    withDelegate delegate: NSInteger,
    withRunningMode runningMode: NSInteger,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let id = FaceLandmarkDetectionModule.nextId
    FaceLandmarkDetectionModule.nextId += 1

    // Convert runningMode to RunningMode enum
    guard let mode = RunningMode(rawValue: UInt(runningMode)) else {
      reject("E_MODE_ERROR", "Invalid running mode", nil)
      return
    }

    do {
      let helper = try FaceLandmarkDetectorHelper(
        handle: id,
        numFaces: numFaces,
        minFaceDetectionConfidence: minFaceDetectionConfidence.floatValue,
        minFacePresenceConfidence: minFacePresenceConfidence.floatValue,
        minTrackingConfidence: minTrackingConfidence.floatValue,
        modelName: model,
        delegate: delegate,
        runningMode: mode)
      helper.delegate = self  // Assuming `self` conforms to `FaceLandmarkDetectorHelperDelegate`

      FaceLandmarkDetectionModule.detectorMap[id] = helper
      resolve(id)
    } catch let error as NSError {
      // If an error is thrown, reject the promise
      // You can customize the error code and message as needed
      reject("ERROR_CODE", "An error occurred: \(error.localizedDescription)", error)
    }
  }

  @objc func releaseDetector(
    _ handle: NSInteger,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if FaceLandmarkDetectionModule.detectorMap.removeValue(forKey: handle) != nil {
      resolve(true)
    } else {
      resolve(false)
    }
  }

  @objc func detectOnImage(
    _ imagePath: String,
    withNumFaces numFaces: NSInteger,
    withMinFaceDetectionConfidence minFaceDetectionConfidence: NSNumber,
    withMinFacePresenceConfidence minFacePresenceConfidence: NSNumber,
    withMinTrackingConfidence minTrackingConfidence: NSNumber,
    withModel model: String,
    withDelegate delegate: NSInteger,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      let helper = try FaceLandmarkDetectorHelper(
        handle: 0,
        numFaces: numFaces,
        minFaceDetectionConfidence: minFaceDetectionConfidence.floatValue,
        minFacePresenceConfidence: minFacePresenceConfidence.floatValue,
        minTrackingConfidence: minTrackingConfidence.floatValue,
        modelName: model,
        delegate: delegate, runningMode: RunningMode.image)
      helper.delegate = self  // Assuming `self` conforms to `FaceLandmarkDetectorHelperDelegate`

      // convert path to UIImage
      let image = try loadImageFromPath(from: imagePath)
      if let result = helper.detect(image: image) {
        let resultArgs = convertFldResultBundleToDictionary(result)
        resolve(resultArgs)
      } else {
        throw NSError(
          domain: "com.FaceLandmarkDetection.error", code: 1001,
          userInfo: [NSLocalizedDescriptionKey: "Detection failed."])
      }
    } catch let error as NSError {
      // If an error is thrown, reject the promise
      // You can customize the error code and message as needed
      reject("ERROR_CODE", "An error occurred: \(error.localizedDescription)", error)
    }
  }

  @objc func detectOnVideo(
    _ videoPath: String,
    withNumFaces numFaces: NSInteger,
    withMinFaceDetectionConfidence minFaceDetectionConfidence: NSNumber,
    withMinFacePresenceConfidence minFacePresenceConfidence: NSNumber,
    withMinTrackingConfidence minTrackingConfidence: NSNumber,
    withModel model: String,
    withDelegate delegate: NSInteger,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      // let helper = try FaceLandmarkDetectorHelper(
      //   handle: 0,
      //   numFaces: numFaces,
      //   minFaceDetectionConfidence: minFaceDetectionConfidence.floatValue,
      //   minFacePresenceConfidence: minFacePresenceConfidence.floatValue,
      //   minTrackingConfidence: minTrackingConfidence.floatValue,
      //   modelName: model,
      //   delegate: delegate,        runningMode: RunningMode.image)
      // helper.delegate = self  // Assuming `self` conforms to `FaceLandmarkDetectorHelperDelegate`

      // // convert path to UIImage
      // let image = try loadImageFromPath(from: imagePath)
      // if let result = helper.detect(image: image) {
      //   let resultArgs = convertFldResultBundleToDictionary(result)
      //   resolve(resultArgs)
      // } else {
      //   throw NSError(
      //     domain: "com.FaceLandmarkDetection.error", code: 1001,
      //     userInfo: [NSLocalizedDescriptionKey: "Detection failed."])
      // }
      throw NSError(
        domain: "com.FaceLandmarkDetection.error", code: 1004,
        userInfo: [NSLocalizedDescriptionKey: "Not implemented."])
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

  private func sendResultsEvent(handle: Int, bundle: FaceLandmarkDetectionResultBundle) {
    // Assuming convertResultBundleToDictionary exists and converts ResultBundle to a suitable dictionary
    var resultArgs = convertFldResultBundleToDictionary(bundle)
    resultArgs["handle"] = handle
    self.sendEvent(withName: "onResults", body: resultArgs)
  }
}

extension FaceLandmarkDetectionModule: FaceLandmarkDetectorHelperDelegate {
  func faceLandmarkDetectorHelper(
    _ faceLandmarkDetectorHelper: FaceLandmarkDetectorHelper,
    onResults result: FaceLandmarkDetectionResultBundle?,
    error: Error?
  ) {
    if let result = result {
      sendResultsEvent(handle: faceLandmarkDetectorHelper.handle, bundle: result)
    } else if let error = error as? NSError {
      sendErrorEvent(
        handle: faceLandmarkDetectorHelper.handle, message: error.localizedDescription,
        code: error.code)
    }
  }
}
