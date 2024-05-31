import UIKit
import MediaPipeTasksVision
import AVFoundation

/**
 This protocol must be adopted by any class that wants to get the detection results of the object detector in live stream mode.
 */
protocol ObjectDetectorHelperDelegate: AnyObject {
  func objectDetectorHelper(_ objectDetectorHelper: ObjectDetectorHelper,
                             onResults result: ObjectDetectionResultBundle?,
                             error: Error?)
}


// Initializes and calls the MediaPipe APIs for detection.
class ObjectDetectorHelper: NSObject {
  
  weak var delegate: ObjectDetectorHelperDelegate?
  
  var objectDetector: ObjectDetector?
  private(set) var runningMode = RunningMode.image
  private var maxResults = 3
  private var scoreThreshold: Float = 0.5
  private var optionsDelegate: Delegate = .CPU
  var modelPath: String
  let handle: Int
  
  // this is an unfortunate hack : we need to provide the client with the size of the
  // image which was being analyzed. This information is helpfully provided except in the
  // case of livestream. So we stash it here for each frame. It changes seldom so
  // this should rarely be an issue
  private var livestreamImageSize: CGSize = CGSize(width: 0, height: 0)
  
  // MARK: - Custom Initializer
  init(
    handle:Int,
    scoreThreshold: Float,
    maxResults: Int,
    modelName: String,
    optionsDelegate: Int,
    runningMode:RunningMode
  ) throws {
    let fileURL = URL(fileURLWithPath: modelName)
    
    let basename = fileURL.deletingPathExtension().lastPathComponent
    let fileExtension = fileURL.pathExtension
    guard let modelPath = Bundle.main.path(forResource: basename, ofType: fileExtension) else {
      throw NSError(domain: "MODEL_NOT_FOUND", code: 0, userInfo: ["message": "Model \(modelName) not found"])
    }
    self.handle = handle
    self.modelPath = modelPath
    self.optionsDelegate = convertIntToDelegate(optionsDelegate)
    self.maxResults = maxResults
    self.scoreThreshold = scoreThreshold
    self.runningMode = runningMode
    super.init()
    
    createObjectDetector()
  }
  
  private func createObjectDetector() {
    let objectDetectorOptions = ObjectDetectorOptions()
    objectDetectorOptions.runningMode = self.runningMode
    objectDetectorOptions.maxResults = self.maxResults
    objectDetectorOptions.scoreThreshold = self.scoreThreshold
    objectDetectorOptions.baseOptions.modelAssetPath = self.modelPath
    objectDetectorOptions.baseOptions.delegate = self.optionsDelegate
    if runningMode == .liveStream {
      objectDetectorOptions.objectDetectorLiveStreamDelegate = self
    }
    do {
      objectDetector = try ObjectDetector(options: objectDetectorOptions)
    }
    catch {
      print(error)
    }
  }
  
  // MARK: - Detection Methods for Different Modes
  /**
   This method return ObjectDetectorResult and infrenceTime when receive an image
   **/
  func detect(image: UIImage) -> ObjectDetectionResultBundle? {
    guard let mpImage = try? MPImage(uiImage: image) else {
      return nil
    }
    do {
      let startDate = Date()
      let result = try objectDetector?.detect(image: mpImage)
      let inferenceTime = Date().timeIntervalSince(startDate) * 1000
      return ObjectDetectionResultBundle(
        inferenceTime: inferenceTime,
        objectDetectorResults: [result],
        size: CGSizeMake(CGFloat(image.size.width), CGFloat(image.size.height))
      )
    } catch {
      print(error)
      return nil
    }
  }
  
  func detectAsync(
    sampleBuffer: CMSampleBuffer,
    orientation: UIImage.Orientation,
    timeStamps: Int) {
      guard let image = try? MPImage(sampleBuffer: sampleBuffer, orientation: orientation) else {
        return
      }
      do {
        self.livestreamImageSize = CGSize(width: image.width, height: image.height)
        try objectDetector?.detectAsync(image: image, timestampInMilliseconds: timeStamps)
      } catch {
        print(error)
      }
    }
  
  func detect(
    videoAsset: AVAsset,
    durationInMilliseconds: Double,
    inferenceIntervalInMilliseconds: Double) async -> ObjectDetectionResultBundle? {
      let startDate = Date()
      let assetGenerator = imageGenerator(with: videoAsset)
      
      let frameCount = Int(durationInMilliseconds / inferenceIntervalInMilliseconds)
      
      let objectDetectorResultTuple = detectObjectsInFramesGenerated(
        by: assetGenerator,
        totalFrameCount: frameCount,
        atIntervalsOf: inferenceIntervalInMilliseconds)
      
      return ObjectDetectionResultBundle(
        inferenceTime: Date().timeIntervalSince(startDate) / Double(frameCount) * 1000,
        objectDetectorResults: objectDetectorResultTuple.objectDetectorResults,
        size: objectDetectorResultTuple.videoSize)
    }
  
  private func imageGenerator(with videoAsset: AVAsset) -> AVAssetImageGenerator {
    let generator = AVAssetImageGenerator(asset: videoAsset)
    generator.requestedTimeToleranceBefore = CMTimeMake(value: 1, timescale: 25)
    generator.requestedTimeToleranceAfter = CMTimeMake(value: 1, timescale: 25)
    generator.appliesPreferredTrackTransform = true
    
    return generator
  }
  
  private func detectObjectsInFramesGenerated(
    by assetGenerator: AVAssetImageGenerator,
    totalFrameCount frameCount: Int,
    atIntervalsOf inferenceIntervalMs: Double)
  -> (objectDetectorResults: [ObjectDetectorResult?], videoSize: CGSize)  {
    var objectDetectorResults: [ObjectDetectorResult?] = []
    var videoSize = CGSize.zero
    var prevTime = Date().timeIntervalSince1970 * 1000
    for i in 0..<frameCount {
      let timestampMs = Int(inferenceIntervalMs) * i // ms
      let image: CGImage
      do {
        let time = CMTime(value: Int64(timestampMs), timescale: 1000)
        //        CMTime(seconds: Double(timestampMs) / 1000, preferredTimescale: 1000)
        image = try assetGenerator.copyCGImage(at: time, actualTime: nil)
      } catch {
        print(error)
        return (objectDetectorResults, videoSize)
      }
      
      let uiImage = UIImage(cgImage:image)
      videoSize = uiImage.size
      
      do {
        let result = try objectDetector?.detect(
          videoFrame: MPImage(uiImage: uiImage),
          timestampInMilliseconds: timestampMs)
        objectDetectorResults.append(result)
        let curTime = Date().timeIntervalSince1970 * 1000
        let inferenceTime = curTime - prevTime
        prevTime = curTime
        let resultBundle = ObjectDetectionResultBundle(
          inferenceTime: inferenceTime,
          objectDetectorResults: [result],
          size: CGSizeMake(CGFloat(image.width), CGFloat(image.height))
        )
        delegate?.objectDetectorHelper(self, onResults: resultBundle, error: nil)
      } catch {
        delegate?.objectDetectorHelper(self, onResults: nil, error: error)
     }
    }
    
    return (objectDetectorResults, videoSize)
  }
}

// MARK: - ObjectDetectorLiveStreamDelegate
extension ObjectDetectorHelper: ObjectDetectorLiveStreamDelegate {
  func objectDetector(
    _ objectDetector: ObjectDetector,
    didFinishDetection result: ObjectDetectorResult?,
    timestampInMilliseconds: Int,
    error: Error?) {
      guard let result = result else {
        delegate?.objectDetectorHelper(self, onResults: nil, error: error)
        return
      }
      let resultBundle = ObjectDetectionResultBundle(
        inferenceTime: Date().timeIntervalSince1970 * 1000 - Double(timestampInMilliseconds),
        objectDetectorResults: [result],
        size: CGSize(width: livestreamImageSize.width, height: livestreamImageSize.height)
      )
      delegate?.objectDetectorHelper(self, onResults: resultBundle, error: nil)
    }
}

/// A result from the `ObjectDetectorHelper`.
struct ObjectDetectionResultBundle {
  let inferenceTime: Double
  let objectDetectorResults: [ObjectDetectorResult?]
  let size: CGSize
}

