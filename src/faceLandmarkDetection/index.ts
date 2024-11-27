import React from "react";
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type LayoutChangeEvent,
} from "react-native";
import {
  VisionCameraProxy,
  runAtTargetFps,
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
  type DetectionCallbacks,
  type DetectionCallbackState, // Add this import
  type ResizeMode,
  type ImageOrientation,
} from "../shared/types";
import { BaseViewCoordinator } from "../shared/convert";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";

const { FaceLandmarkDetection } = NativeModules;
const eventEmitter = new NativeEventEmitter(FaceLandmarkDetection);

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  "faceLandmarkDetection",
  {},
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
    runningMode: RunningMode,
  ) => Promise<number>;
  releaseDetector: (handle: number) => Promise<boolean>;
  detectOnImage: (
    imagePath: string,
    numFaces: number,
    minFaceDetectionConfidence: number,
    minFacePresenceConfidence: number,
    minTrackingConfidence: number,
    model: string,
    delegate: Delegate,
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
}

interface Category {
  categoryName?: string;
  displayName?: string;
  score: number;
}

interface Classifications {
  headIndex: number;
  headName?: string;
  categories: Category[];
}

export interface FaceLandmarkerResult {
  faceLandmarks: Landmark[][];
  faceBlendshapes: Classifications[];
  facialTransformationMatrixes: TransformMatrix[];
}

type FpsMode = "none" | number;

export interface FaceLandmarkDetectionOptions {
  numFaces: number;
  minFaceDetectionConfidence: number;
  minFacePresenceConfidence: number;
  minTrackingConfidence: number;
  delegate: Delegate;
  mirrorMode: "no-mirror" | "mirror" | "mirror-front-only";
  forceOutputOrientation?: ImageOrientation;
  forceCameraOrientation?: ImageOrientation;
  fpsMode?: FpsMode;
}

const detectorMap = new Map<
  number,
  DetectionCallbackState<FaceLandmarkDetectionResultBundle>
>();

eventEmitter.addListener(
  "onResults",
  (args: { handle: number } & FaceLandmarkDetectionResultBundle) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args, callbacks.viewCoordinator);
    }
  },
);

eventEmitter.addListener(
  "onError",
  (args: { handle: number } & DetectionError) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onError(args);
    }
  },
);

export function useFaceLandmarkDetection(
  callbacks: DetectionCallbacks<FaceLandmarkDetectionResultBundle>,
  runningMode: RunningMode,
  model: string,
  options?: Partial<FaceLandmarkDetectionOptions>,
): MediaPipeSolution {
  const [detectorHandle, setDetectorHandle] = React.useState<
    number | undefined
  >();
  const [cameraViewDimensions, setCameraViewDimensions] = React.useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 });

  const outputOrientation = useSharedValue<Orientation>("portrait");
  const frameOrientation = useSharedValue<Orientation>("portrait");
  const forceOutputOrientation = useSharedValue<ImageOrientation | undefined>(
    undefined,
  );
  const forceCameraOrientation = useSharedValue<ImageOrientation | undefined>(
    undefined,
  );

  const cameraViewLayoutChangeHandler = React.useCallback(
    (event: LayoutChangeEvent) => {
      setCameraViewDimensions({
        height: event.nativeEvent.layout.height,
        width: event.nativeEvent.layout.width,
      });
    },
    [],
  );

  React.useEffect(() => {
    forceCameraOrientation.value = options?.forceCameraOrientation;
    forceOutputOrientation.value = options?.forceOutputOrientation;
  }, [
    forceCameraOrientation,
    forceOutputOrientation,
    options?.forceCameraOrientation,
    options?.forceOutputOrientation,
  ]);

  const mirrorMode =
    options?.mirrorMode ??
    Platform.select({ android: "mirror-front-only", default: "no-mirror" });

  const [cameraDevice, setCameraDevice] = React.useState<
    CameraDevice | undefined
  >();
  const [resizeMode, setResizeMode] = React.useState<ResizeMode>("cover");

  const mirrored = React.useMemo((): boolean => {
    return (
      (mirrorMode === "mirror-front-only" &&
        cameraDevice?.position === "front") ||
      mirrorMode === "mirror"
    );
  }, [cameraDevice?.position, mirrorMode]);

  const updateDetectorMap = React.useCallback(() => {
    if (detectorHandle !== undefined) {
      const viewCoordinator = new BaseViewCoordinator(
        cameraViewDimensions,
        mirrored,
        forceCameraOrientation.value ?? frameOrientation.value,
        forceOutputOrientation.value ?? outputOrientation.value,
        resizeMode,
      );
      detectorMap.set(detectorHandle, {
        onResults: callbacks.onResults,
        onError: callbacks.onError,
        viewCoordinator,
      });
    }
  }, [
    cameraViewDimensions,
    detectorHandle,
    forceCameraOrientation.value,
    forceOutputOrientation.value,
    frameOrientation.value,
    mirrored,
    callbacks.onError,
    callbacks.onResults,
    outputOrientation.value,
    resizeMode,
  ]);

  React.useLayoutEffect(() => {
    updateDetectorMap();
  }, [updateDetectorMap]);

  React.useEffect(() => {
    let newHandle: number | undefined;
    getFaceLandmarkDetectionModule()
      .createDetector(
        options?.numFaces ?? 1,
        options?.minFaceDetectionConfidence ?? 0.5,
        options?.minFacePresenceConfidence ?? 0.5,
        options?.minTrackingConfidence ?? 0.5,
        model,
        options?.delegate ?? Delegate.GPU,
        runningMode,
      )
      .then((handle) => {
        setDetectorHandle(handle);
        newHandle = handle;
      });
    return () => {
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

  const updateDetectorMapFromWorklet = useRunOnJS(updateDetectorMap, [
    updateDetectorMap,
  ]);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (frame.orientation !== frameOrientation.value) {
        frameOrientation.value = frame.orientation;
        updateDetectorMapFromWorklet();
      }
      const orientation: ImageOrientation =
        forceOutputOrientation.value ?? outputOrientation.value;
      const fpsMode = options?.fpsMode ?? "none";

      if (fpsMode === "none") {
        plugin?.call(frame, {
          detectorHandle,
          orientation,
        });
      } else {
        runAtTargetFps(fpsMode, () => {
          plugin?.call(frame, {
            detectorHandle,
            orientation,
          });
        });
      }
    },
    [
      detectorHandle,
      forceOutputOrientation.value,
      frameOrientation,
      options?.fpsMode,
      outputOrientation.value,
      updateDetectorMapFromWorklet,
    ],
  );

  return React.useMemo(
    (): MediaPipeSolution => ({
      cameraViewLayoutChangeHandler,
      cameraDeviceChangeHandler: (d) => {
        setCameraDevice(d);
      },
      cameraOrientationChangedHandler: (o) => {
        outputOrientation.value = o;
      },
      resizeModeChangeHandler: setResizeMode,
      cameraViewDimensions,
      frameProcessor,
    }),
    [
      cameraViewDimensions,
      cameraViewLayoutChangeHandler,
      frameProcessor,
      outputOrientation,
    ],
  );
}

export function faceLandmarkDetectionOnImage(
  imagePath: string,
  model: string,
  options?: Partial<FaceLandmarkDetectionOptions>,
): Promise<FaceLandmarkDetectionResultBundle> {
  return getFaceLandmarkDetectionModule().detectOnImage(
    imagePath,
    options?.numFaces ?? 1,
    options?.minFaceDetectionConfidence ?? 0.5,
    options?.minFacePresenceConfidence ?? 0.5,
    options?.minTrackingConfidence ?? 0.5,
    model,
    options?.delegate ?? Delegate.GPU,
  );
}
