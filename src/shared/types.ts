import type { LayoutChangeEvent } from "react-native";
import type {
  CameraDevice,
  ReadonlyFrameProcessor,
} from "react-native-vision-camera";

export interface MediaPipeSolution {
  frameProcessor: ReadonlyFrameProcessor;
  cameraViewLayoutChangeHandler: (event: LayoutChangeEvent) => void;
  cameraDeviceChangeHandler: (device: CameraDevice | undefined) => void;
  cameraViewDimensions: { width: number; height: number };
}
