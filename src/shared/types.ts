import type { LayoutChangeEvent } from "react-native";
import type { ReadonlyFrameProcessor } from "react-native-vision-camera";

export interface MediaPipeSolution {
  frameProcessor: ReadonlyFrameProcessor;
  cameraViewLayoutChangeHandler: (event: LayoutChangeEvent) => void;
  cameraViewDimensions: { width: number; height: number };
}
