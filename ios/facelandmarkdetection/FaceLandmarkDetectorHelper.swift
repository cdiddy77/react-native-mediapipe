import AVFoundation
import MediaPipeTasksVision
import UIKit

/// This protocol must be adopted by any class that wants to get the detection results of the object detector in live stream mode.
protocol FaceLandmarkDetectorHelperDelegate: AnyObject {
  func faceLandmarkDetectorHelper(
    _ faceLandmarkDetectorHelper: FaceLandmarkDetectorHelper,
    onResults result: FaceLandmarkDetectionResultBundle?,
    error: Error?)
}

// Initializes and calls the MediaPipe APIs for detection.
class FaceLandmarkDetectorHelper: NSObject {

  weak var delegate: FaceLandmarkDetectorHelperDelegate?

  var faceLandmarker: FaceLandmarker?
  private(set) var runningMode = RunningMode.image
  private var numFaces: Int
  private var minFaceDetectionConfidence: Float
  private var minFacePresenceConfidence: Float
  private var minTrackingConfidence: Float
  private var optionsDelegate: Delegate
  var modelPath: String
  
  let handle: Int

  // this is an unfortunate hack : we need to provide the client with the size of the
  // image which was being analyzed. This information is helpfully provided except in the
  // case of livestream. So we stash it here for each frame. It changes seldom so
  // this should rarely be an issue
  private var livestreamImageSize: CGSize = CGSize(width: 0, height: 0)

  // MARK: - Custom Initializer
  init(
    handle: Int,
    numFaces: Int,
    minFaceDetectionConfidence: Float,
    minFacePresenceConfidence: Float,
    minTrackingConfidence: Float,
    modelName: String,
    delegate: Int,
    runningMode: RunningMode
  ) throws {
    let fileURL = URL(fileURLWithPath: modelName)

    let basename = fileURL.deletingPathExtension().lastPathComponent
    let fileExtension = fileURL.pathExtension
    guard let modelPath = Bundle.main.path(forResource: basename, ofType: fileExtension) else {
      throw NSError(
        domain: "MODEL_NOT_FOUND", code: 0, userInfo: ["message": "Model \(modelName) not found"])
    }
    self.handle = handle
    self.modelPath = modelPath
    self.optionsDelegate = convertIntToDelegate(delegate)
    self.numFaces = numFaces
    self.minFaceDetectionConfidence = minFaceDetectionConfidence
    self.minFacePresenceConfidence = minFacePresenceConfidence
    self.minTrackingConfidence = minTrackingConfidence
    self.runningMode = runningMode
    super.init()

    createFaceLandmarkDetector()
  }

  private func createFaceLandmarkDetector() {
    let faceLandmarkerOptions = FaceLandmarkerOptions()
    faceLandmarkerOptions.runningMode = self.runningMode
    faceLandmarkerOptions.numFaces = self.numFaces
    faceLandmarkerOptions.minFaceDetectionConfidence = self.minFaceDetectionConfidence
    faceLandmarkerOptions.minFacePresenceConfidence = self.minFacePresenceConfidence
    faceLandmarkerOptions.minTrackingConfidence = self.minTrackingConfidence
    faceLandmarkerOptions.baseOptions.modelAssetPath = self.modelPath
    faceLandmarkerOptions.baseOptions.delegate = self.optionsDelegate
    if runningMode == .liveStream {
      faceLandmarkerOptions.faceLandmarkerLiveStreamDelegate = self
    }
    do {
      faceLandmarker = try FaceLandmarker(options: faceLandmarkerOptions)
    } catch {
      print(error)
    }
  }

  // MARK: - Detection Methods for Different Modes
  /**
   This method return FaceLandmarkDetectorResult and infrenceTime when receive an image
   **/
  func detect(image: UIImage) -> FaceLandmarkDetectionResultBundle? {
    guard let mpImage = try? MPImage(uiImage: image) else {
      return nil
    }
    do {
      let startDate = Date()
      let result = try faceLandmarker?.detect(image: mpImage)
      let inferenceTime = Date().timeIntervalSince(startDate) * 1000
      return FaceLandmarkDetectionResultBundle(
        inferenceTime: inferenceTime,
        faceLandmarkDetectorResults: [result],
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
    timeStamps: Int
  ) {
    guard let image = try? MPImage(sampleBuffer: sampleBuffer, orientation: orientation) else {
      return
    }
    do {
      self.livestreamImageSize = CGSize(width: image.width, height: image.height)
      try faceLandmarker?.detectAsync(image: image, timestampInMilliseconds: timeStamps)
    } catch {
      print(error)
    }
  }

  func detect(
    videoAsset: AVAsset,
    durationInMilliseconds: Double,
    inferenceIntervalInMilliseconds: Double
  ) async -> FaceLandmarkDetectionResultBundle? {
    let startDate = Date()
    let assetGenerator = imageGenerator(with: videoAsset)

    let frameCount = Int(durationInMilliseconds / inferenceIntervalInMilliseconds)

    let faceLandmarkDetectorResultTuple = detectObjectsInFramesGenerated(
      by: assetGenerator,
      totalFrameCount: frameCount,
      atIntervalsOf: inferenceIntervalInMilliseconds)

    return FaceLandmarkDetectionResultBundle(
      inferenceTime: Date().timeIntervalSince(startDate) / Double(frameCount) * 1000,
      faceLandmarkDetectorResults: faceLandmarkDetectorResultTuple.faceLandmarkDetectorResults,
      size: faceLandmarkDetectorResultTuple.videoSize)
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
    atIntervalsOf inferenceIntervalMs: Double
  )
    -> (faceLandmarkDetectorResults: [FaceLandmarkerResult?], videoSize: CGSize)
  {
    var faceLandmarkDetectorResults: [FaceLandmarkerResult?] = []
    var videoSize = CGSize.zero
    var prevTime = Date().timeIntervalSince1970 * 1000
    for i in 0..<frameCount {
      let timestampMs = Int(inferenceIntervalMs) * i  // ms
      let image: CGImage
      do {
        let time = CMTime(value: Int64(timestampMs), timescale: 1000)
        image = try assetGenerator.copyCGImage(at: time, actualTime: nil)
      } catch {
        print(error)
        return (faceLandmarkDetectorResults, videoSize)
      }

      let uiImage = UIImage(cgImage: image)
      videoSize = uiImage.size

      do {
        let result = try self.faceLandmarker?.detect(
          videoFrame: MPImage(uiImage: uiImage),
          timestampInMilliseconds: timestampMs)
        faceLandmarkDetectorResults.append(result)
        let curTime = Date().timeIntervalSince1970 * 1000
        let inferenceTime = curTime - prevTime
        prevTime = curTime
        let resultBundle = FaceLandmarkDetectionResultBundle(
          inferenceTime: inferenceTime,
          faceLandmarkDetectorResults: [result],
          size: CGSizeMake(CGFloat(image.width), CGFloat(image.height))
        )
        delegate?.faceLandmarkDetectorHelper(self, onResults: resultBundle, error: nil)
      } catch {
        delegate?.faceLandmarkDetectorHelper(self, onResults: nil, error: error)
      }
    }

    return (faceLandmarkDetectorResults, videoSize)
  }
}

// MARK: - FaceLandmarkDetectorLiveStreamDelegate
extension FaceLandmarkDetectorHelper: FaceLandmarkerLiveStreamDelegate {
  func faceLandmarker(
    _ faceLandmarker: FaceLandmarker,
    didFinishDetection result: FaceLandmarkerResult?,
    timestampInMilliseconds: Int,
    error: Error?
  ) {
    guard let result = result else {
      delegate?.faceLandmarkDetectorHelper(self, onResults: nil, error: error)
      return
    }
    let resultBundle = FaceLandmarkDetectionResultBundle(
      inferenceTime: Date().timeIntervalSince1970 * 1000 - Double(timestampInMilliseconds),
      faceLandmarkDetectorResults: [result],
      size: CGSize(width: livestreamImageSize.width, height: livestreamImageSize.height)
    )
    delegate?.faceLandmarkDetectorHelper(self, onResults: resultBundle, error: nil)
  }
}

/// A result from the `FaceLandmarkDetectorHelper`.
struct FaceLandmarkDetectionResultBundle {
  let inferenceTime: Double
  let faceLandmarkDetectorResults: [FaceLandmarkerResult?]
  let size: CGSize
}

