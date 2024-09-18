import React from "react";
import { type ViewStyle, Text } from "react-native";
import {
  Camera,
  useCameraDevice,
  type CameraPosition,
  type CameraProps,
} from "react-native-vision-camera";
import type { MediaPipeSolution } from "./types";

export type MediapipeCameraProps = {
  style: ViewStyle;
  solution: MediaPipeSolution;
  activeCamera?: CameraPosition;
  // orientation?: Orientation;
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
    console.log(
      `camera device change. sensorOrientation:${device?.sensorOrientation}`
    );

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
      onOutputOrientationChanged={(o) => {
        console.log(`output orientation change:${o}`);
        cameraOrientationChangedHandler(o);
      }}
    />
  ) : (
    <Text>no device</Text>
  );
};
