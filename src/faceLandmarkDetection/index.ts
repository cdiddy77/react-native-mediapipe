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
  type DetectionError,
  type Dims,
  type Landmark,
  type MediaPipeSolution,
  type RunningMode,
  type TransformMatrix,
} from "../shared/types";
import { useSharedValue } from "react-native-worklets-core";

const { FaceLandmarkDetection } = NativeModules;
const eventEmitter = new NativeEventEmitter(FaceLandmarkDetection);

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  "faceLandmarkDetection",
  {}
);
if (!plugin) {
  throw new Error("Failed to initialize faceLandmarkDetection plugin");
}

interface FaceLandmarkDetectionModule {
  createDetector: (
    numFaces: number,
    minFaceDetectionConfidence: number,
    minFacePresenceConfidence: number,
    minTrackingConfidence: number,
    model: string,
    delegate: Delegate,
    runningMode: RunningMode
  ) => Promise<number>;
  releaseDetector: (handle: number) => Promise<boolean>;
  detectOnImage: (
    imagePath: string,
    numFaces: number,
    minFaceDetectionConfidence: number,
    minFacePresenceConfidence: number,
    minTrackingConfidence: number,
    model: string,
    delegate: Delegate
  ) => Promise<FaceLandmarkDetectionResultBundle>;
}

// Defines a connector with start and end points
export interface FaceLandmarkConnection {
  start: number;
  end: number;
}

// Defines landmarks as arrays of connectors
interface KnownLandmarks {
  lips: FaceLandmarkConnection[];
  leftEye: FaceLandmarkConnection[];
  leftEyebrow: FaceLandmarkConnection[];
  leftIris: FaceLandmarkConnection[];
  rightEye: FaceLandmarkConnection[];
  rightEyebrow: FaceLandmarkConnection[];
  rightIris: FaceLandmarkConnection[];
  faceOval: FaceLandmarkConnection[];
  connectors: FaceLandmarkConnection[];
  tesselation: FaceLandmarkConnection[];
}

// Wraps the FaceLandmarks in a higher-level structure
export interface FaceLandmarksModuleConstants {
  knownLandmarks: KnownLandmarks;
}

function getFaceLandmarkDetectionModule(): FaceLandmarkDetectionModule {
  if (FaceLandmarkDetection === undefined || FaceLandmarkDetection === null) {
    throw new Error("FaceLandmarkDetection module is not available");
  }
  return FaceLandmarkDetection as FaceLandmarkDetectionModule;
}

export function faceLandmarkDetectionModuleConstants(): FaceLandmarksModuleConstants {
  if (FaceLandmarkDetection === undefined || FaceLandmarkDetection === null) {
    throw new Error("FaceLandmarkDetection module is not available");
  }
  return FaceLandmarkDetection.getConstants() as FaceLandmarksModuleConstants;
}

export interface FaceLandmarkDetectionResultBundle {
  results: FaceLandmarkerResult[];
  inferenceTime: number;
  inputImageHeight: number;
  inputImageWidth: number;
  // inputImageRotation: number;
}

// Interface for the category, assuming this is part of the classifications
interface Category {
  categoryName?: string;
  displayName?: string;
  score: number;
}

// Interface for classifications, which hold categories and additional metadata
interface Classifications {
  headIndex: number;
  headName?: string; // Optional as it might be uninitialized
  categories: Category[];
}

// Interface for FaceLandmarkerResult
export interface FaceLandmarkerResult {
  faceLandmarks: Landmark[][];
  faceBlendshapes: Classifications[];
  facialTransformationMatrixes: TransformMatrix[];
}

export interface FaceLandmarkDetectionOptions {
  numFaces: number;
  minFaceDetectionConfidence: number;
  minFacePresenceConfidence: number;
  minTrackingConfidence: number;
  delegate: Delegate;
  mirrorMode: "no-mirror" | "mirror" | "mirror-front-only";
}

export interface FaceLandmarkDetectionCallbacks {
  onResults: (
    result: FaceLandmarkDetectionResultBundle,
    viewSize: Dims,
    mirrored: boolean
  ) => void;
  onError: (error: DetectionError) => void;
  viewSize: Dims;
  mirrored: boolean;
}

// TODO setup the general event callbacks
const detectorMap: Map<number, FaceLandmarkDetectionCallbacks> = new Map();
eventEmitter.addListener(
  "onResults",
  (args: { handle: number } & FaceLandmarkDetectionResultBundle) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args, callbacks.viewSize, callbacks.mirrored);
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

export function useFaceLandmarkDetection(
  onResults: FaceLandmarkDetectionCallbacks["onResults"],
  onError: FaceLandmarkDetectionCallbacks["onError"],
  runningMode: RunningMode,
  model: string,
  options?: Partial<FaceLandmarkDetectionOptions>
): MediaPipeSolution {
  const [detectorHandle, setDetectorHandle] = React.useState<
    number | undefined
  >();

  const [cameraViewDimensions, setCameraViewDimensions] = React.useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 });

  const outputOrientation = useSharedValue<Orientation>("portrait");

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
  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    if (detectorHandle !== undefined) {
      detectorMap.set(detectorHandle, {
        onResults,
        onError,
        viewSize: cameraViewDimensions,
        mirrored,
      });
    }
  }, [onResults, onError, detectorHandle, cameraViewDimensions, mirrored]);

  React.useEffect(() => {
    let newHandle: number | undefined;
    console.log(
      `getFaceLandmarkDetectionModule: delegate = ${options?.delegate}, numFaces= ${options?.numFaces}, runningMode = ${runningMode}, model= ${model}`
    );
    getFaceLandmarkDetectionModule()
      .createDetector(
        options?.numFaces ?? 1,
        options?.minFaceDetectionConfidence ?? 0.5,
        options?.minFacePresenceConfidence ?? 0.5,
        options?.minTrackingConfidence ?? 0.5,
        model,
        options?.delegate ?? Delegate.GPU,
        runningMode
      )
      .then((handle) => {
        console.log(
          "useFaceLandmarkDetection.createDetector",
          runningMode,
          model,
          handle
        );
        setDetectorHandle(handle);
        newHandle = handle;
      });
    return () => {
      console.log(
        "useFaceLandmarkDetection.useEffect.unsub",
        "releaseDetector",
        newHandle
      );
      if (newHandle !== undefined) {
        getFaceLandmarkDetectionModule().releaseDetector(newHandle);
      }
    };
  }, [
    options?.delegate,
    runningMode,
    model,
    options?.numFaces,
    options?.minFaceDetectionConfidence,
    options?.minFacePresenceConfidence,
    options?.minTrackingConfidence,
  ]);
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      // console.log(frame.orientation, frame.width, frame.height);
      plugin?.call(frame, { detectorHandle });
    },
    [detectorHandle]
  );
  return React.useMemo(
    (): MediaPipeSolution => ({
      cameraViewLayoutChangeHandler,
      cameraDeviceChangeHandler: setCameraDevice,
      cameraOrientationChangedHandler: (o) => {
        outputOrientation.value = o;
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      resizeModeChangeHandler: () => {},
      cameraViewDimensions,
      frameProcessor,
    }),
    [
      cameraViewDimensions,
      cameraViewLayoutChangeHandler,
      frameProcessor,
      outputOrientation,
    ]
  );
}

export function faceLandmarkDetectionOnImage(
  imagePath: string,
  model: string,
  options?: Partial<FaceLandmarkDetectionOptions>
): Promise<FaceLandmarkDetectionResultBundle> {
  return getFaceLandmarkDetectionModule().detectOnImage(
    imagePath,
    options?.numFaces ?? 1,
    options?.minFaceDetectionConfidence ?? 0.5,
    options?.minFacePresenceConfidence ?? 0.5,
    options?.minTrackingConfidence ?? 0.5,
    model,
    options?.delegate ?? Delegate.GPU
  );
}
