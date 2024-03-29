import React, { useState } from "react";
import { type ViewStyle, StyleSheet, Text, View } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import {
  type ResultBundleMap,
  RunningMode,
  useObjectDetection,
} from "./objectDetection";

type MediapipeProps = {
  style: ViewStyle;
  resultsPanel: boolean;
};

// TODONEXT: Figure out how to get the callback to work
//  List the objects detected in the results panel
//  Make that panel be scrollable
//  Clean up the layout
export const MediapipeCamera: React.FC<MediapipeProps> = ({
  style,
  resultsPanel,
}) => {
  const [stats, setStats] = useState<ResultBundleMap | null>(null);
  const device = useCameraDevice("back");
  const frameProcessor = useObjectDetection(
    (results) => {
      setStats(results);
      console.log("WE'VE GOT RESULTS");
      console.log(results);
    },
    (error) => {
      console.log(error);
    },
    RunningMode.LIVE_STREAM,
    "efficientdet-lite0.tflite"
  );

  if (device === undefined) {
    return <Text>no device</Text>;
  }

  const camera = (
    <Camera
      style={resultsPanel ? styles.box : style}
      device={device}
      pixelFormat="yuv"
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );

  return resultsPanel ? (
    <View style={{ flexDirection: "column", alignItems: "stretch" }}>
      {camera}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignSelf: "stretch",
          backgroundColor: "lightgray",
        }}
      >
        <View style={{ width: "100%" }}>
          <Text>count: {stats?.results.length}</Text>
          <Text>inferenceTime: {stats?.inferenceTime}</Text>
        </View>
      </View>
    </View>
  ) : (
    camera
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 3,
    flexDirection: "row",
  },
});
