import * as React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";
import { MediapipeCamera } from "react-native-mediapipe";
import {
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";

export default function App(): React.ReactElement | null {
  const camPerm = useCameraPermission();
  const micPerm = useMicrophonePermission();
  const [permsGranted, setPermsGranted] = React.useState<{
    cam: boolean;
    mic: boolean;
  }>({ cam: camPerm.hasPermission, mic: micPerm.hasPermission });

  const askForPermissions = React.useCallback(() => {
    if (camPerm.hasPermission) {
      setPermsGranted((prev) => ({ ...prev, cam: true }));
    } else {
      camPerm.requestPermission().then((granted) => {
        setPermsGranted((prev) => ({ ...prev, cam: granted }));
      });
    }
    if (micPerm.hasPermission) {
      setPermsGranted((prev) => ({ ...prev, mic: true }));
    } else {
      micPerm.requestPermission().then((granted) => {
        setPermsGranted((prev) => ({ ...prev, mic: granted }));
      });
    }
  }, [camPerm, micPerm]);
  console.log("App", permsGranted);
  return (
    <View style={styles.container}>
      {permsGranted.cam && permsGranted.mic ? (
        <MediapipeCamera style={styles.box} />
      ) : (
        <>
          <Text style={styles.noPermsText}>
            Camera and Mic permissions required
          </Text>
          <Pressable onPress={askForPermissions}>
            <Text style={styles.permsButton}>Request</Text>
          </Pressable>
        </>
      )}
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
    flex: 1,
    alignSelf: "stretch",
  },
  permsButton: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noPermsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
  },
});
