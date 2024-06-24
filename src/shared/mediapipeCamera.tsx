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
    cameraOrientationChangedHandler,
    resizeModeChangeHandler,
    frameProcessor,
  },
  activeCamera = "front",
  resizeMode = "cover",
}) => {
  const device = useCameraDevice(activeCamera);
  React.useEffect(() => {
    cameraDeviceChangeHandler(device);
  }, [cameraDeviceChangeHandler, device]);
  React.useEffect(() => {
    resizeModeChangeHandler(resizeMode);
  }, [resizeModeChangeHandler, resizeMode]);

  return device !== undefined ? (
    <Camera
      resizeMode={resizeMode}
      style={style}
      device={device}
      pixelFormat={"rgb"}
      outputOrientation="preview"
      isActive={true}
      frameProcessor={frameProcessor}
      onLayout={cameraViewLayoutChangeHandler}
      onOutputOrientationChanged={cameraOrientationChangedHandler}
    />
  ) : (
    <Text>no device</Text>
  );
};
