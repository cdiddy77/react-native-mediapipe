import * as React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MediapipeCamera,
  RunningMode,
  faceLandmarkDetectionModuleConstants,
  useFaceLandmarkDetection,
  type FaceLandmarksModuleConstants,
} from "react-native-mediapipe";

import {
  useCameraPermission,
  useMicrophonePermission,
  type CameraPosition,
} from "react-native-vision-camera";
import type { RootTabParamList } from "./navigation";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useSettings } from "./app-settings";
import {
  FaceDrawFrame,
  convertLandmarksToSegments,
  type FaceSegment,
} from "./Drawing";

type Props = BottomTabScreenProps<RootTabParamList, "CameraStream">;

export const CameraStream: React.FC<Props> = () => {
  // TODO : implement settings for face landmark detection
  const { settings } = useSettings();
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

  const [active, setActive] = React.useState<CameraPosition>("front");
  const setActiveCamera = () => {
    setActive((currentCamera) =>
      currentCamera === "front" ? "back" : "front"
    );
  };
  const [faceLandmarks] = React.useState<
    FaceLandmarksModuleConstants["knownLandmarks"]
  >(faceLandmarkDetectionModuleConstants().knownLandmarks);

  const [faceSegments, setFaceSegments] = React.useState<FaceSegment[]>([
    {
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 100 },
      color: "Coral",
    },
  ]);

  const faceDetection = useFaceLandmarkDetection(
    (results, viewSize, mirrored) => {
      if (results.results.length === 0) {
        setFaceSegments([]);
        return;
      }
      const firstResult = results.results[0];
      const segments =
        firstResult.faceLandmarks.length > 0
          ? [
              ...convertLandmarksToSegments(
                firstResult.faceLandmarks[0],
                faceLandmarks.lips,
                "FireBrick",
                {
                  width: results.inputImageWidth,
                  height: results.inputImageHeight,
                },
                viewSize,
                mirrored
              ),
              ...convertLandmarksToSegments(
                firstResult.faceLandmarks[0],
                faceLandmarks.leftEye,
                "ForestGreen",
                {
                  width: results.inputImageWidth,
                  height: results.inputImageHeight,
                },
                viewSize,
                mirrored
              ),
              ...convertLandmarksToSegments(
                firstResult.faceLandmarks[0],
                faceLandmarks.rightEye,
                "ForestGreen",
                {
                  width: results.inputImageWidth,
                  height: results.inputImageHeight,
                },
                viewSize,
                mirrored
              ),
              ...convertLandmarksToSegments(
                firstResult.faceLandmarks[0],
                faceLandmarks.leftEyebrow,
                "Coral",
                {
                  width: results.inputImageWidth,
                  height: results.inputImageHeight,
                },
                viewSize,
                mirrored
              ),
              ...convertLandmarksToSegments(
                firstResult.faceLandmarks[0],
                faceLandmarks.rightEyebrow,
                "Coral",
                {
                  width: results.inputImageWidth,
                  height: results.inputImageHeight,
                },
                viewSize,
                mirrored
              ),
            ]
          : [];

      setFaceSegments(segments);
    },
    (error) => {
      console.error(`onError: ${error}`);
    },
    RunningMode.LIVE_STREAM,
    "face_landmarker.task",
    {
      delegate: settings.processor,
    }
  );
  if (permsGranted.cam && permsGranted.mic) {
    return (
      <View style={styles.container}>
        <MediapipeCamera
          style={styles.box}
          solution={faceDetection}
          activeCamera={active}
          resizeMode="cover"
        />

        <FaceDrawFrame
          style={styles.box}
          facePoints={[]}
          faceSegments={faceSegments}
        />
        <Pressable style={styles.cameraSwitchButton} onPress={setActiveCamera}>
          <Text style={styles.cameraSwitchButtonText}>Switch Camera</Text>
        </Pressable>
      </View>
    );
  } else {
    return <NeedPermissions askForPermissions={askForPermissions} />;
  }
};

const NeedPermissions: React.FC<{ askForPermissions: () => void }> = ({
  askForPermissions,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.permissionsBox}>
        <Text style={styles.noPermsText}>
          Allow App to use your Camera and Microphone
        </Text>
        <Text style={styles.permsInfoText}>
          App needs access to your camera in order for Object Detection to work.
        </Text>
      </View>
      <Pressable style={styles.permsButton} onPress={askForPermissions}>
        <Text style={styles.permsButtonText}>Allow</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF0F0",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  box: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  permsButton: {
    padding: 15.5,
    paddingRight: 25,
    paddingLeft: 25,
    backgroundColor: "#F95F48",
    borderRadius: 5,
    margin: 15,
  },
  permsButtonText: {
    fontSize: 17,
    color: "black",
    fontWeight: "bold",
  },
  permissionsBox: {
    backgroundColor: "#F3F3F3",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCCACA",
    marginBottom: 20,
  },
  noPermsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  permsInfoText: {
    fontSize: 15,
    color: "black",
    marginTop: 12,
  },
  cameraSwitchButton: {
    position: "absolute",
    padding: 10,
    backgroundColor: "#F95F48",
    borderRadius: 20,
    top: 20,
    right: 20,
  },
  cameraSwitchButtonText: {
    color: "white",
    fontSize: 16,
  },
});
