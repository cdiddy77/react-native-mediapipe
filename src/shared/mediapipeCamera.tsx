import React from "react";
import { type ViewStyle, Text, Platform } from "react-native";
import {
  Camera,
  useCameraDevice,
  type CameraPosition,
  type CameraProps,
  type Orientation,
} from "react-native-vision-camera";
import type { MediaPipeSolution } from "./types";

export type MediapipeCameraProps = {
  style: ViewStyle;
  solution: MediaPipeSolution;
  activeCamera?: CameraPosition;
  orientation?: Orientation;
  resizeMode?: CameraProps["resizeMode"];
};

export const MediapipeCamera: React.FC<MediapipeCameraProps> = ({
  style,
  solution,
  activeCamera = "front",
  orientation = "portrait",
  resizeMode = "cover",
}) => {
  const device = useCameraDevice(activeCamera);
  return device !== undefined ? (
    <Camera
      resizeMode={resizeMode}
      style={style}
      device={device}
      orientation={orientation}
      pixelFormat={Platform.select({ ios: "rgb", android: "yuv" })}
      isActive={true}
      frameProcessor={solution.frameProcessor}
      onLayout={solution.cameraViewLayoutChangeHandler}
    />
  ) : (
    <Text>no device</Text>
  );
};
