import * as React from "react";

import { StyleSheet, View } from "react-native";
import { MediapipeCamera } from "react-native-mediapipe";

export default function App(): React.ReactElement | null {
  return (
    <View style={styles.container}>
      <MediapipeCamera color="#32a852" style={styles.box} />
      <View />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
