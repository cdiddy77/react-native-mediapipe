import React from "react";
import { type ViewStyle, Text } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { RunningMode, useObjectDetection } from "./objectDetection";

type MediapipeProps = {
  style: ViewStyle;
};

export const MediapipeCamera: React.FC<MediapipeProps> = ({ style }) => {
  const device = useCameraDevice("front");
  const frameProcessor = useObjectDetection(
    (results) => {
      console.log(results);
    },
    (error) => {
      console.log(error);
    },
    RunningMode.LIVE_STREAM,
    "efficientdet-lite0.tflite"
  );
  return device !== undefined ? (
    <Camera
      style={style}
      device={device}
      pixelFormat="yuv"
      isActive={true}
      frameProcessor={frameProcessor}
    />
  ) : (
    <Text>no device</Text>
  );
};
