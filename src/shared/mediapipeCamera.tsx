import React from "react";
import { type ViewStyle, Text } from "react-native";
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
  solution: {
    cameraDeviceChangeHandler,
    cameraViewLayoutChangeHandler,
    frameProcessor,
  },
  activeCamera = "front",
  orientation = "portrait",
  resizeMode = "cover",
}) => {
  const device = useCameraDevice(activeCamera);
  React.useEffect(() => {
    cameraDeviceChangeHandler(device);
  }, [cameraDeviceChangeHandler, device]);
  return device !== undefined ? (
    <Camera
      resizeMode={resizeMode}
      style={style}
      device={device}
      orientation={orientation}
      pixelFormat={"rgb"}
      isActive={true}
      frameProcessor={frameProcessor}
      onLayout={cameraViewLayoutChangeHandler}
    />
  ) : (
    <Text>no device</Text>
  );
};
