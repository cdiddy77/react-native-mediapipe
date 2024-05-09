import React from "react";
import {
  NativeEventEmitter,
  NativeModules,
  type LayoutChangeEvent,
} from "react-native";
import {
  VisionCameraProxy,
  useFrameProcessor,
} from "react-native-vision-camera";
import type { MediaPipeSolution } from "../shared/types";
import type { Dims } from "../shared/convert";

const { ObjectDetection } = NativeModules;
const eventEmitter = new NativeEventEmitter(ObjectDetection);

const plugin = VisionCameraProxy.initFrameProcessorPlugin("objectDetection");
if (!plugin) {
  throw new Error("Failed to initialize objectdetection plugin");
}

interface ObjectDetectionModule {
  createDetector: (
    threshold: number,
    maxResults: number,
    delegate: Delegate,
    model: string,
    runningMode: RunningMode
  ) => Promise<number>;
  releaseDetector: (handle: number) => Promise<boolean>;
}

function getObjectDetectionModule(): ObjectDetectionModule {
  if (ObjectDetection === undefined || ObjectDetection === null) {
    throw new Error("ObjectDetection module is not available");
  }
  return ObjectDetection as ObjectDetectionModule;
}

export interface ResultBundleMap {
  results: ObjectDetectionResultMap[];
  inferenceTime: number;
  inputImageHeight: number;
  inputImageWidth: number;
  inputImageRotation: number;
}

interface ObjectDetectionResultMap {
  timestampMs: number;
  detections: DetectionMap[];
}

interface DetectionMap {
  boundingBox: RectFMap;
  categories: CategoryMap[];
  keypoints?: KeypointMap[];
}

interface RectFMap {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CategoryMap {
  score: number;
  index: number;
  categoryName: string;
  displayName: string;
}

interface KeypointMap {
  x: number;
  y: number;
  label?: string;
  score?: number;
}

interface ObjectDetectionError {
  code: number;
  message: string;
}

// eslint-disable-next-line no-restricted-syntax
export enum Delegate {
  CPU = 0,
  GPU = 1,
}

// eslint-disable-next-line no-restricted-syntax
export enum RunningMode {
  IMAGE = 0,
  VIDEO = 1,
  LIVE_STREAM = 2,
}

export interface ObjectDetectionOptions {
  threshold: number;
  maxResults: number;
  delegate: Delegate;
  resize: { scale: number; aspect: "preserve" | "default" | number };
}
export interface ObjectDetectionCallbacks {
  onResults: (result: ResultBundleMap, viewSize: Dims) => void;
  onError: (error: ObjectDetectionError) => void;
  viewSize: Dims;
}

// TODO setup the general event callbacks
const detectorMap: Map<number, ObjectDetectionCallbacks> = new Map();
eventEmitter.addListener(
  "onResults",
  (args: { handle: number } & ResultBundleMap) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args, callbacks.viewSize);
    }
  }
);
eventEmitter.addListener(
  "onError",
  (args: { handle: number } & ObjectDetectionError) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onError(args);
    }
  }
);

export function useObjectDetection(
  onResults: ObjectDetectionCallbacks["onResults"],
  onError: ObjectDetectionCallbacks["onError"],
  runningMode: RunningMode,
  model: string,
  options?: Partial<ObjectDetectionOptions>
): MediaPipeSolution {
  const [detectorHandle, setDetectorHandle] = React.useState<
    number | undefined
  >();

  const [cameraViewDimensions, setCameraViewDimensions] = React.useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 });

  const cameraViewLayoutChangeHandler = React.useCallback(
    (event: LayoutChangeEvent) => {
      setCameraViewDimensions({
        height: event.nativeEvent.layout.height,
        width: event.nativeEvent.layout.width,
      });
    },
    []
  );

  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    if (detectorHandle !== undefined) {
      detectorMap.set(detectorHandle, {
        onResults,
        onError,
        viewSize: cameraViewDimensions,
      });
    }
  }, [onResults, onError, detectorHandle, cameraViewDimensions]);

  React.useEffect(() => {
    let newHandle: number | undefined;
    console.log(
      `getObjectDetectionModule: delegate = ${options?.delegate}, maxResults= ${options?.maxResults}, runningMode = ${runningMode}, threshold = ${options?.threshold}, model= ${model}`
    );
    getObjectDetectionModule()
      .createDetector(
        options?.threshold ?? 0.5,
        options?.maxResults ?? 3,
        options?.delegate ?? Delegate.GPU,
        model,
        runningMode
      )
      .then((handle) => {
        console.log(
          "useObjectDetection.createDetector",
          runningMode,
          model,
          handle
        );
        setDetectorHandle(handle);
        newHandle = handle;
      });
    return () => {
      console.log(
        "useObjectDetection.useEffect.unsub",
        "releaseDetector",
        newHandle
      );
      if (newHandle !== undefined) {
        getObjectDetectionModule().releaseDetector(newHandle);
      }
    };
  }, [
    options?.delegate,
    options?.maxResults,
    runningMode,
    options?.threshold,
    model,
  ]);
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";

      plugin?.call(frame, {
        detectorHandle,
        pixelFormat: "rgb",
        dataType: "uint8",
      });
    },
    [detectorHandle]
  );
  return React.useMemo(
    (): MediaPipeSolution => ({
      cameraViewLayoutChangeHandler,
      cameraViewDimensions,
      frameProcessor,
    }),
    [cameraViewDimensions, cameraViewLayoutChangeHandler, frameProcessor]
  );
}
