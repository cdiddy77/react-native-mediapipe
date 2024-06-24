import AVFoundation
import MediaPipeTasksVision
import UIKit

/**
 This protocol must be adopted by any class that wants to get the detection results of the pose landmarker in live stream mode.
 */
protocol PoseDetectorHelperLiveStreamDelegate: AnyObject {
  func poseDetectorHelper(_ poseDetectorHelper: PoseDetectorHelper,
                             onResults result: PoseDetectionResultBundle?,
                             error: Error?)
}

/**
 This protocol must be adopted by any class that wants to take appropriate actions during  different stages of pose landmark on videos.
 */
protocol PoseDetectorHelperVideoDelegate: AnyObject {
 func poseDetectorHelper(_ poseDetectorHelper: PoseDetectorHelper,
                                  didFinishDetectionOnVideoFrame index: Int)
 func poseDetectorHelper(_ poseDetectorHelper: PoseDetectorHelper,
                             willBeginDetection totalframeCount: Int)
}


// Initializes and calls the MediaPipe APIs for detection.
class PoseDetectorHelper: NSObject {

  weak var liveStreamDelegate: PoseDetectorHelperLiveStreamDelegate?
  weak var videoDelegate: PoseDetectorHelperVideoDelegate?

  var poseLandmarker: PoseLandmarker?
  private(set) var runningMode = RunningMode.image
  private var numPoses: Int
  private var minPoseDetectionConfidence: Float
  private var minPosePresenceConfidence: Float
  private var minTrackingConfidence: Float
  private var shouldOutputSegmentationMasks: Bool
  private var delegate: Delegate
  private var modelPath: String
  
  let handle: Int
  
  // this is an unfortunate hack : we need to provide the client with the size of the
  // image which was being analyzed. This information is helpfully provided except in the
  // case of livestream. So we stash it here for each frame. It changes seldom so
  // this should rarely be an issue
  private var livestreamImageSize: CGSize = CGSize(width: 0, height: 0)

  // MARK: - Custom Initializer
  init(
    handle:Int,
    numPoses: Int,
    minPoseDetectionConfidence: Float,
    minPosePresenceConfidence: Float,
    minTrackingConfidence: Float,
    shouldOutputSegmentationMasks: Bool,
    modelName: String,
    delegate: Int,
    runningMode:RunningMode
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
    self.runningMode = runningMode
    self.numPoses = numPoses
    self.minPoseDetectionConfidence = minPoseDetectionConfidence
    self.minPosePresenceConfidence = minPosePresenceConfidence
    self.minTrackingConfidence = minTrackingConfidence
    self.shouldOutputSegmentationMasks = shouldOutputSegmentationMasks
    self.delegate = convertIntToDelegate(delegate)
    super.init()

    createPoseLandmarker()
  }

  private func createPoseLandmarker() {
    let poseLandmarkerOptions = PoseLandmarkerOptions()
    poseLandmarkerOptions.runningMode = runningMode
    poseLandmarkerOptions.numPoses = numPoses
    poseLandmarkerOptions.minPoseDetectionConfidence = minPoseDetectionConfidence
    poseLandmarkerOptions.minPosePresenceConfidence = minPosePresenceConfidence
    poseLandmarkerOptions.minTrackingConfidence = minTrackingConfidence
    poseLandmarkerOptions.shouldOutputSegmentationMasks = shouldOutputSegmentationMasks
    poseLandmarkerOptions.baseOptions.modelAssetPath = modelPath
    poseLandmarkerOptions.baseOptions.delegate = delegate
    if runningMode == .liveStream {
      poseLandmarkerOptions.poseLandmarkerLiveStreamDelegate = self
    }
    do {
      poseLandmarker = try PoseLandmarker(options: poseLandmarkerOptions)
    }
    catch {
      print(error)
    }
  }

  // MARK: - Detection Methods for Different Modes
  /**
   This method return PoseLandmarkerResult and infrenceTime when receive an image
   **/
  func detect(image: UIImage) -> PoseDetectionResultBundle? {
    guard let mpImage = try? MPImage(uiImage: image) else {
      return nil
    }
    do {
      let startDate = Date()
      let result = try poseLandmarker?.detect(image: mpImage)
      let inferenceTime = Date().timeIntervalSince(startDate) * 1000
      return PoseDetectionResultBundle(
        inferenceTime: inferenceTime,
        poseDetectorResults: [result],
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
      try poseLandmarker?.detectAsync(image: image, timestampInMilliseconds: timeStamps)
    } catch {
      print(error)
    }
  }

  func detect(
    videoAsset: AVAsset,
    durationInMilliseconds: Double,
    inferenceIntervalInMilliseconds: Double) async -> PoseDetectionResultBundle? {
    let startDate = Date()
    let assetGenerator = imageGenerator(with: videoAsset)

    let frameCount = Int(durationInMilliseconds / inferenceIntervalInMilliseconds)
    Task { @MainActor in
      videoDelegate?.poseDetectorHelper(self, willBeginDetection: frameCount)
    }

    let poseLandmarkerResultTuple = detectPoseLandmarksInFramesGenerated(
      by: assetGenerator,
      totalFrameCount: frameCount,
      atIntervalsOf: inferenceIntervalInMilliseconds)

    return PoseDetectionResultBundle(
      inferenceTime: Date().timeIntervalSince(startDate) / Double(frameCount) * 1000,
      poseDetectorResults: poseLandmarkerResultTuple.poseLandmarkerResults,
      size: poseLandmarkerResultTuple.videoSize)
  }

  private func imageGenerator(with videoAsset: AVAsset) -> AVAssetImageGenerator {
    let generator = AVAssetImageGenerator(asset: videoAsset)
    generator.requestedTimeToleranceBefore = CMTimeMake(value: 1, timescale: 25)
    generator.requestedTimeToleranceAfter = CMTimeMake(value: 1, timescale: 25)
    generator.appliesPreferredTrackTransform = true

    return generator
  }

  private func detectPoseLandmarksInFramesGenerated(
    by assetGenerator: AVAssetImageGenerator,
    totalFrameCount frameCount: Int,
    atIntervalsOf inferenceIntervalMs: Double)
  -> (poseLandmarkerResults: [PoseLandmarkerResult?], videoSize: CGSize)  {
    var poseLandmarkerResults: [PoseLandmarkerResult?] = []
    var videoSize = CGSize.zero
    var prevTime = Date().timeIntervalSince1970 * 1000

    for i in 0..<frameCount {
      let timestampMs = Int(inferenceIntervalMs) * i // ms
      let image: CGImage
      do {
        let time = CMTime(value: Int64(timestampMs), timescale: 1000)
        image = try assetGenerator.copyCGImage(at: time, actualTime: nil)
      } catch {
        print(error)
        return (poseLandmarkerResults, videoSize)
      }

      let uiImage = UIImage(cgImage:image)
      videoSize = uiImage.size

      do {
        let result = try poseLandmarker?.detect(
          videoFrame: MPImage(uiImage: uiImage),
          timestampInMilliseconds: timestampMs)
          poseLandmarkerResults.append(result)
        let curTime = Date().timeIntervalSince1970 * 1000
        let inferenceTime = curTime - prevTime
        prevTime = curTime
        let resultBundle = PoseDetectionResultBundle(
          inferenceTime: inferenceTime,
          poseDetectorResults: [result],
          size: CGSizeMake(CGFloat(image.width), CGFloat(image.height))
        )
        videoDelegate?.poseDetectorHelper(self, didFinishDetectionOnVideoFrame: i)
      } catch {
        print(error)
      }
    }

    return (poseLandmarkerResults, videoSize)
  }
}

// MARK: - PoseLandmarkerLiveStreamDelegate Methods
extension PoseDetectorHelper: PoseLandmarkerLiveStreamDelegate {
    func poseLandmarker(_ poseLandmarker: PoseLandmarker, didFinishDetection result: PoseLandmarkerResult?, timestampInMilliseconds: Int, error: (any Error)?) {
        let resultBundle = PoseDetectionResultBundle(
          inferenceTime: Date().timeIntervalSince1970 * 1000 - Double(timestampInMilliseconds),
          poseDetectorResults: [result],
          size: CGSize(width: livestreamImageSize.width, height: livestreamImageSize.height)
        )
        liveStreamDelegate?.poseDetectorHelper(
          self,
          onResults:  resultBundle,
          error: error)
    }
}

/// A result from the `PoseDetectorHelper`.
struct PoseDetectionResultBundle {
  let inferenceTime: Double
  let poseDetectorResults: [PoseLandmarkerResult?]
  var size: CGSize
}
