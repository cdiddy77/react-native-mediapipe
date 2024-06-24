import React from "react";
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type LayoutChangeEvent,
} from "react-native";
import {
  VisionCameraProxy,
  useFrameProcessor,
  type CameraDevice,
  type Orientation,
} from "react-native-vision-camera";
import {
  Delegate,
  type MediaPipeSolution,
  RunningMode,
  type Landmark,
  type Mask,
  type DetectionCallbackState,
  type DetectionError,
  type ViewCoordinator,
  type DetectionResultBundle,
  type FrameProcessInfo,
  type DetectionCallbacks,
  dimsByOrientation,
  orientationToRotation,
  rotateCounterclockwise,
  mirror,
} from "../shared/types";
import {
  denormalizePoint,
  framePointToView,
  rotateNormalizedPoint,
  type Dims,
  type Point,
  type ResizeMode,
} from "../shared/convert";

const { PoseDetection } = NativeModules;
const eventEmitter = new NativeEventEmitter(PoseDetection);

const plugin = VisionCameraProxy.initFrameProcessorPlugin("poseDetection", {});

if (!plugin) {
  throw new Error("Failed to initialize posedetection plugin");
}

interface PoseDetectionModule {
  createDetector: (
    numPoses: number,
    minPoseDetectionConfidence: number,
    minPosePresenceConfidence: number,
    minTrackingConfidence: number,
    shouldOutputSegmentationMasks: boolean,
    model: string,
    delegate: Delegate,
    runningMode: RunningMode
  ) => Promise<number>;
  releaseDetector: (handle: number) => Promise<boolean>;
  detectOnImage: (
    imagePath: string,
    numPoses: number,
    minPoseDetectionConfidence: number,
    minPosePresenceConfidence: number,
    minTrackingConfidence: number,
    shouldOutputSegmentationMasks: boolean,
    model: string,
    delegate: Delegate
  ) => Promise<PoseDetectionResultBundle>;
}

export interface PoseLandmarkerResult {
  landmarks: Landmark[][];
  worldLandmarks: Landmark[][];
  segmentationMasks: Mask[];
}

export type PoseDetectionResultBundle =
  DetectionResultBundle<PoseLandmarkerResult>;

export interface PoseDetectionOptions {
  numPoses: number;
  minPoseDetectionConfidence: number;
  minPosePresenceConfidence: number;
  minTrackingConfidence: number;
  shouldOutputSegmentationMasks: boolean;
  delegate: Delegate;
  mirrorMode: "no-mirror" | "mirror" | "mirror-front-only";
}

type PoseDetectionCallbackState =
  DetectionCallbackState<PoseDetectionResultBundle>;

function getPoseDetectionModule(): PoseDetectionModule {
  if (PoseDetection === undefined || PoseDetection === null) {
    throw new Error("PoseDetection module is not available");
  }
  return PoseDetection as PoseDetectionModule;
}

const detectorMap = new Map<number, PoseDetectionCallbackState>();
eventEmitter.addListener(
  "onResults",
  (args: { handle: number } & PoseDetectionResultBundle) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args, callbacks.viewCoordinator);
    }
  }
);
eventEmitter.addListener(
  "onError",
  (args: { handle: number } & DetectionError) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onError(args);
    }
  }
);

export function usePoseDetection(
  callbacks: DetectionCallbacks<PoseDetectionResultBundle>,
  runningMode: RunningMode,
  model: string,
  options?: Partial<PoseDetectionOptions>
): MediaPipeSolution {
  const [detectorHandle, setDetectorHandle] = React.useState<
    number | undefined
  >();

  const [cameraViewDimensions, setCameraViewDimensions] = React.useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 });
  const [outputOrientation, setOutputOrientation] =
    React.useState<Orientation>("portrait");

  const cameraViewLayoutChangeHandler = React.useCallback(
    (event: LayoutChangeEvent) => {
      setCameraViewDimensions({
        height: event.nativeEvent.layout.height,
        width: event.nativeEvent.layout.width,
      });
    },
    []
  );
  const mirrorMode =
    options?.mirrorMode ??
    Platform.select({ android: "mirror-front-only", default: "no-mirror" });
  const [cameraDevice, setCameraDevice] = React.useState<
    CameraDevice | undefined
  >(undefined);
  const mirrored = React.useMemo((): boolean => {
    if (
      (mirrorMode === "mirror-front-only" &&
        cameraDevice?.position === "front") ||
      mirrorMode === "mirror"
    ) {
      return true;
    } else {
      return false;
    }
  }, [cameraDevice?.position, mirrorMode]);

  const [resizeMode, setResizeMode] = React.useState<ResizeMode>("cover");

  const { onResults, onError } = callbacks;

  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    if (detectorHandle !== undefined) {
      const viewCoordinator = new PoseViewCoordinator(
        cameraViewDimensions,
        mirrored,
        outputOrientation,
        resizeMode
      );
      detectorMap.set(detectorHandle, {
        onResults,
        onError,
        viewCoordinator,
      });
    }
  }, [
    detectorHandle,
    cameraViewDimensions,
    mirrored,
    outputOrientation,
    onResults,
    onError,
    resizeMode,
  ]);
  React.useEffect(() => {
    let newHandle: number | undefined;
    console.log(
      `getPoseDetectionModule: delegate = ${options?.delegate}, runningMode = ${runningMode}, model= ${model}`
    );
    getPoseDetectionModule()
      .createDetector(
        options?.numPoses ?? 1,
        options?.minPoseDetectionConfidence ?? 0.5,
        options?.minPosePresenceConfidence ?? 0.5,
        options?.minTrackingConfidence ?? 0.5,
        options?.shouldOutputSegmentationMasks ?? false,
        model,
        options?.delegate ?? Delegate.GPU,
        runningMode
      )
      .then((handle) => {
        console.log(
          "usePoseDetection.createDetector",
          runningMode,
          model,
          handle
        );
        setDetectorHandle(handle);
        newHandle = handle;
      })
      .catch((e) => {
        console.error(`Failed to create detector: ${e}`);
      });
    return () => {
      console.log(
        "usePoseDetection.useEffect.unsub",
        "releaseDetector",
        newHandle
      );
      if (newHandle !== undefined) {
        getPoseDetectionModule().releaseDetector(newHandle);
      }
    };
  }, [
    options?.delegate,
    runningMode,
    model,
    options?.numPoses,
    options?.minPoseDetectionConfidence,
    options?.minPosePresenceConfidence,
    options?.minTrackingConfidence,
    options?.shouldOutputSegmentationMasks,
  ]);
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      plugin?.call(frame, { detectorHandle });
    },
    [detectorHandle]
  );
  return React.useMemo(
    (): MediaPipeSolution => ({
      cameraViewLayoutChangeHandler,
      cameraDeviceChangeHandler: setCameraDevice,
      cameraOrientationChangedHandler: setOutputOrientation,
      resizeModeChangeHandler: setResizeMode,
      cameraViewDimensions,
      frameProcessor,
    }),
    [cameraViewDimensions, cameraViewLayoutChangeHandler, frameProcessor]
  );
}

export function PoseDetectionOnImage(
  imagePath: string,
  model: string,
  options?: Partial<PoseDetectionOptions>
): Promise<PoseDetectionResultBundle> {
  return getPoseDetectionModule().detectOnImage(
    imagePath,
    options?.numPoses ?? 1,
    options?.minPoseDetectionConfidence ?? 0.5,
    options?.minPosePresenceConfidence ?? 0.5,
    options?.minTrackingConfidence ?? 0.5,
    options?.shouldOutputSegmentationMasks ?? false,
    model,
    options?.delegate ?? Delegate.GPU
  );
}

class PoseViewCoordinator implements ViewCoordinator {
  private rotation: number;
  private orientation: Orientation;
  constructor(
    private viewSize: Dims,
    private mirrored: boolean,
    orientation: Orientation,
    private resizeMode: ResizeMode
  ) {
    this.orientation = Platform.select({
      default: orientation,
      android: rotateCounterclockwise(orientation),
    });
    if (Platform.OS === "android" && mirrored) {
      this.orientation = mirror(this.orientation);
    }
    this.rotation = orientationToRotation(this.orientation);
  }
  getFrameDims(info: FrameProcessInfo): Dims {
    return dimsByOrientation(
      this.orientation,
      info.inputImageWidth,
      info.inputImageHeight
    );
  }
  convertPoint(frame: Dims, p: Point): Point {
    return framePointToView(
      denormalizePoint(rotateNormalizedPoint(p, this.rotation), frame),
      frame,
      this.viewSize,
      this.resizeMode,
      this.mirrored
    );
  }
}

export const KnownPoseLandmarks = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  mouthLeft: 9,
  mouthRight: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
};

export const KnownPoseLandmarkConnections = [
  [0, 5],
  [5, 8],
  [0, 2],
  [2, 7],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32],
];
