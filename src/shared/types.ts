import type { LayoutChangeEvent } from "react-native";
import type {
  CameraDevice,
  ReadonlyFrameProcessor,
} from "react-native-vision-camera";
import type { Dims } from "./convert";

export interface MediaPipeSolution {
  frameProcessor: ReadonlyFrameProcessor;
  cameraViewLayoutChangeHandler: (event: LayoutChangeEvent) => void;
  cameraDeviceChangeHandler: (device: CameraDevice | undefined) => void;
  cameraViewDimensions: { width: number; height: number };
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

export interface DetectionError {
  code: number;
  message: string;
}

export interface DetectionCallbacks<TResultBundle> {
  onResults: (result: TResultBundle, viewSize: Dims, mirrored: boolean) => void;
  onError: (error: DetectionError) => void;
  viewSize: Dims;
  mirrored: boolean;
}
