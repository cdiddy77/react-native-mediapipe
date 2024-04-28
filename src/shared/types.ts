import type { LayoutChangeEvent } from "react-native";
import type { FrameProcessor } from "react-native-vision-camera";

export interface MediaPipeSolution {
  frameProcessor: FrameProcessor;
  cameraViewLayoutChangeHandler: (event: LayoutChangeEvent) => void;
  cameraViewDimensions: { width: number; height: number };
}
