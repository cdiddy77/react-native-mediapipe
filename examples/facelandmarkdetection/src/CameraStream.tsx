import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  MediapipeCamera,
  RunningMode,
  useFaceLandmarkDetection,
  faceLandmarkDetectionModuleConstants,
  type DetectionError,
  type FaceLandmarkDetectionResultBundle,
  type ViewCoordinator,
} from "react-native-mediapipe";

import {
  useCameraPermission,
  type CameraPosition,
} from "react-native-vision-camera";
import type { RootTabParamList } from "./navigation";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useSettings } from "./app-settings";
import { FaceDrawFrame } from "./Drawing";
import { useSharedValue } from "react-native-reanimated";
import { vec, type SkPoint } from "@shopify/react-native-skia";

type Props = BottomTabScreenProps<RootTabParamList, "CameraStream">;
const MINIMUM_CONFIDENCE = 0.5; // Adjust this threshold as needed

export const CameraStream: React.FC<Props> = () => {
  const { settings } = useSettings();
  const camPerm = useCameraPermission();
  const [permsGranted, setPermsGranted] = React.useState<{
    cam: boolean;
  }>({ cam: camPerm.hasPermission });

  const askForPermissions = React.useCallback(() => {
    if (camPerm.hasPermission) {
      setPermsGranted((prev) => ({ ...prev, cam: true }));
    } else {
      camPerm.requestPermission().then((granted) => {
        setPermsGranted((prev) => ({ ...prev, cam: granted }));
      });
    }
  }, [camPerm]);

  const [active, setActive] = React.useState<CameraPosition>("front");
  const setActiveCamera = () => {
    setActive((currentCamera) =>
      currentCamera === "front" ? "back" : "front",
    );
  };

  const faceConnections = useSharedValue<SkPoint[]>([]);
  const isProcessing = useSharedValue(false);
  const { knownLandmarks } = faceLandmarkDetectionModuleConstants();

  // Memoize the connections array to avoid recreating it on every render
  const allConnections = React.useMemo(
    () => [
      ...knownLandmarks.lips,
      ...knownLandmarks.leftEye,
      ...knownLandmarks.rightEye,
      ...knownLandmarks.leftEyebrow,
      ...knownLandmarks.rightEyebrow,
      ...knownLandmarks.faceOval,
    ],
    [knownLandmarks],
  );

  const updateFaceConnections = React.useCallback(
    (newPoints: SkPoint[]) => {
      "worklet";
      faceConnections.value = newPoints;
    },
    [faceConnections],
  );

  const processFaceLandmarks = React.useCallback(
    (landmarks: any[], frameDims: any, vc: ViewCoordinator) => {
      if (isProcessing.value) {
        return;
      }

      try {
        isProcessing.value = true;
        const newLines: SkPoint[] = [];

        for (const { start, end } of allConnections) {
          if (null === landmarks[start] || null === landmarks[end]) {
            continue;
          }

          if (
            (landmarks[start].presence ?? 1) < MINIMUM_CONFIDENCE ||
            (landmarks[end].presence ?? 1) < MINIMUM_CONFIDENCE
          ) {
            continue;
          }

          const pt1 = vc.convertPoint(frameDims, landmarks[start]);
          const pt2 = vc.convertPoint(frameDims, landmarks[end]);

          if (
            !Number.isFinite(pt1.x) ||
            !Number.isFinite(pt1.y) ||
            !Number.isFinite(pt2.x) ||
            !Number.isFinite(pt2.y)
          ) {
            continue;
          }

          newLines.push(vec(pt1.x, pt1.y));
          newLines.push(vec(pt2.x, pt2.y));
        }

        updateFaceConnections(newLines);
      } finally {
        isProcessing.value = false;
      }
    },
    [allConnections, updateFaceConnections, isProcessing],
  );

  const onResults = React.useCallback(
    (results: FaceLandmarkDetectionResultBundle, vc: ViewCoordinator): void => {
      if (isProcessing.value) {
        return;
      }

      const frameDims = vc.getFrameDims(results);
      const landmarks = results.results[0]?.faceLandmarks[0] ?? [];

      if (landmarks.length > 0) {
        processFaceLandmarks(landmarks, frameDims, vc);
      } else {
        updateFaceConnections([]);
      }
    },
    [isProcessing, processFaceLandmarks, updateFaceConnections],
  );

  const onError = React.useCallback(
    (error: DetectionError): void => {
      console.error(`Face detection error: ${JSON.stringify(error)}`);
      isProcessing.value = false;
    },
    [isProcessing],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      faceConnections.value = [];
      isProcessing.value = false;
    };
  }, [faceConnections, isProcessing]);

  const faceDetection = useFaceLandmarkDetection(
    {
      onResults,
      onError,
    },
    RunningMode.LIVE_STREAM,
    "face_landmarker.task",
    {
      fpsMode: 30,
      delegate: settings.processor,
      mirrorMode: "no-mirror",
    },
  );

  if (permsGranted.cam) {
    return (
      <View style={styles.container}>
        <MediapipeCamera
          style={styles.box}
          solution={faceDetection}
          activeCamera={active}
          resizeMode="cover"
        />
        <FaceDrawFrame connections={faceConnections} style={styles.box} />
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
        <Text style={styles.noPermsText}>Allow App to use your Camera</Text>
        <Text style={styles.permsInfoText}>
          App needs access to your camera in order for Face Detection to work.
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
