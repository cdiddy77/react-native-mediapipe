import React, { useEffect, forwardRef } from "react";
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
  resizeMode?: CameraProps["resizeMode"];
};

export const MediapipeCamera = forwardRef<Camera, MediapipeCameraProps>(
  (
    {
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
    },
    ref
  ) => {
    const device = useCameraDevice(activeCamera);

    useEffect(() => {
      if (device) {
        cameraDeviceChangeHandler(device);
      }
    }, [cameraDeviceChangeHandler, device]);

    useEffect(() => {
      resizeModeChangeHandler(resizeMode);
    }, [resizeModeChangeHandler, resizeMode]);

    if (device == null) {
      return <Text>Loading...</Text>;
    }

    return (
      <Camera
        ref={ref}
        resizeMode={resizeMode}
        style={style}
        device={device}
        pixelFormat="rgb"
        isActive={true}
        frameProcessor={frameProcessor}
        onLayout={cameraViewLayoutChangeHandler}
        onOutputOrientationChanged={cameraOrientationChangedHandler}
        photo={true}
      />
    );
  }
);
