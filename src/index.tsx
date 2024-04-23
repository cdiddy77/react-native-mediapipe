import React from "react";
import { type ViewStyle, Text, Platform } from "react-native";
import {
  Camera,
  useCameraDevice,
  type FrameProcessor,
} from "react-native-vision-camera";

export type MediapipeCameraProps = {
  style: ViewStyle;
  processor: FrameProcessor;
};

export const MediapipeCamera: React.FC<MediapipeCameraProps> = ({
  style,
  processor,
  activeCamera,
}) => {
  const device = useCameraDevice(activeCamera);
  return device !== undefined ? (
    <Camera
      style={style}
      device={device}
      pixelFormat={Platform.select({ ios: "rgb", android: "yuv" })}
      isActive={true}
      frameProcessor={processor}
    />
  ) : (
    <Text>no device</Text>
  );
};

export * from "./objectDetection";
