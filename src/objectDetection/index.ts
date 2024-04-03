import React from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import {
  VisionCameraProxy,
  useFrameProcessor,
} from "react-native-vision-camera";

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
}
export interface ObjectDetectionCallbacks {
  onResults: (result: ResultBundleMap) => void;
  onError: (error: ObjectDetectionError) => void;
}

// TODO setup the general event callbacks
const detectorMap: Map<number, ObjectDetectionCallbacks> = new Map();
eventEmitter.addListener(
  "onResults",
  (args: { handle: number } & ResultBundleMap) => {
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args);
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
) {
  const [detectorHandle, setDetectorHandle] = React.useState<
    number | undefined
  >();

  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    if (detectorHandle !== undefined) {
      detectorMap.set(detectorHandle, { onResults, onError });
    }
  }, [onResults, onError, detectorHandle]);

  React.useEffect(() => {
    let newHandle: number | undefined;
    getObjectDetectionModule()
      .createDetector(
        options?.threshold ?? 0.5,
        options?.maxResults ?? 3,
        options?.delegate ?? Delegate.CPU,
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
      });
    },
    [detectorHandle]
  );
  return frameProcessor;
}
