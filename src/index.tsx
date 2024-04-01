import React, { useState } from "react";
import { Platform, type ViewStyle, Text, View, StyleSheet } from "react-native";
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

// TODO:
//  Keep track of the last non-zero infereance and display that for
//   some time after the inference is done if the next ones are zero
//  Make the stats panel scrollable
//  Clean up the layout
//  displayName is empty - should this be filled in by the frameProcessor?
export const MediapipeCamera: React.FC<MediapipeProps> = ({
  style,
  resultsPanel,
}) => {
  const [stats, setStats] = useState<ResultBundleMap | null>(null);
  const device = useCameraDevice("back");
  const frameProcessor = useObjectDetection(
    (results) => {
      setStats(results);
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
      pixelFormat={Platform.select({ ios: "rgb", android: "yuv" })}
      isActive={true}
      frameProcessor={frameProcessor}
    />
  );

  let rows: React.JSX.Element[] = [];
  let count = 0;

  if ((stats?.results.length ?? 0) > 1) {
    console.log("more than one result", stats?.results.length);
  }

  if (stats?.results && stats.results.length > 0 && stats.results[0]) {
    count = stats.results[0].detections.length;
    rows = stats.results[0].detections.map((obj) => {
      const categories = obj.categories
        .map((cat) => `${cat.categoryName} (${cat.score})`)
        .join(", ");
      const text = `${categories}: ${JSON.stringify(obj.boundingBox)}`;
      console.log(text);
      return <Text>{text}</Text>;
    });
  }

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
          <Text>inferenceTime: {stats?.inferenceTime}</Text>
          <Text>count: {count}</Text>
          {rows}
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
