import React from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import {
  VisionCameraProxy,
  type FrameProcessorPlugin,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useSharedValue } from "react-native-worklets-core";

const { ObjectDetection } = NativeModules;
const eventEmitter = new NativeEventEmitter(ObjectDetection);

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
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
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
enum Delegate {
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
    console.log("onResults", JSON.stringify(args));
    const callbacks = detectorMap.get(args.handle);
    if (callbacks) {
      callbacks.onResults(args);
    }
  }
);
eventEmitter.addListener(
  "onError",
  (args: { handle: number } & ObjectDetectionError) => {
    console.log("onError", JSON.stringify(args));
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
  console.log("useObjectDetection", { runningMode, model, options });
  const processor = useSharedValue<
    | { detectorHandle: number; plugin: FrameProcessorPlugin | undefined }
    | undefined
  >(undefined);

  // Remember the latest callback if it changes.
  React.useLayoutEffect(() => {
    if (processor.value?.detectorHandle !== undefined) {
      detectorMap.set(processor.value.detectorHandle, { onResults, onError });
    }
  }, [onResults, onError, processor.value?.detectorHandle]);

  React.useEffect(() => {
    const plugin =
      VisionCameraProxy.initFrameProcessorPlugin("objectDetection");

    getObjectDetectionModule()
      .createDetector(
        options?.threshold ?? 0.5,
        options?.maxResults ?? 3,
        options?.delegate ?? Delegate.GPU,
        model,
        runningMode
      )
      .then((handle) => {
        console.log("useObjectDetection", runningMode, model, handle);
        processor.value = { detectorHandle: handle, plugin };
      });
    return () => {
      console.log("useObjectDetection.useEffect.unsub", "releaseDetector");
      if (processor.value?.detectorHandle !== undefined) {
        getObjectDetectionModule().releaseDetector(
          processor.value.detectorHandle
        );
      }
    };
  }, [
    options?.delegate,
    options?.maxResults,
    runningMode,
    options?.threshold,
    processor,
    model,
  ]);
  console.log("useObjectDetection", { processor: processor.value });
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      processor.value?.plugin?.call(frame, {
        detectorHandle: processor.value.detectorHandle,
      });
    },
    [processor.value?.detectorHandle, processor.value?.plugin]
  );
  return frameProcessor;
}
