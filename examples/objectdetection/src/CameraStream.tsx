import {
  Canvas,
  Group,
  Rect,
  Text as SkiaText,
  matchFont,
} from "@shopify/react-native-skia";
import * as React from "react";

import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Delegate,
  MediapipeCamera,
  RunningMode,
  useObjectDetection,
} from "react-native-mediapipe";

import {
  useCameraPermission,
  useMicrophonePermission,
  type CameraPosition,
} from "react-native-vision-camera";
import type { RootTabParamList } from "./navigation";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { frameRectToView, ltrbToXywh } from "../../../src/shared/convert";

interface Detection {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Props = BottomTabScreenProps<RootTabParamList, "CameraStream">;

export const CameraStream: React.FC<Props> = () => {
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

  const [objectFrames, setObjectFrames] = React.useState<Detection[]>([]);

  const [active, setActive] = React.useState<CameraPosition>("front");
  const setActiveCamera = () => {
    setActive((currentCamera) =>
      currentCamera === "front" ? "back" : "front"
    );
  };

  const objectDetection = useObjectDetection(
    (results, viewSize) => {
      const firstResult = results.results[0];
      const detections = firstResult?.detections ?? [];
      const frameSize = {
        width: results.inputImageWidth,
        height: results.inputImageHeight,
      };
      setObjectFrames(
        detections.map((detection) => {
          const { x, y, width, height } = frameRectToView(
            ltrbToXywh(detection.boundingBox),
            frameSize,
            viewSize,
            "cover"
          );
          return {
            label: detection.categories[0]?.categoryName ?? "unknown",
            x,
            y,
            width,
            height,
          };
        })
      );
    },
    (error) => {
      console.error(`onError: ${error}`);
    },
    RunningMode.LIVE_STREAM,
    "efficientdet-lite0.tflite",
    { delegate: Delegate.GPU }
  );

  if (permsGranted.cam && permsGranted.mic) {
    return (
      <View style={styles.container}>
        <MediapipeCamera
          style={styles.box}
          solution={objectDetection}
          activeCamera={active}
          resizeMode="cover" // must agree with frameRectToView above
        />
        <Canvas style={styles.box}>
          {objectFrames.map((frame, index) => (
            <ObjectFrame frame={frame} index={index} key={index} />
          ))}
        </Canvas>
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
      <Text style={styles.noPermsText}>
        Camera and Mic permissions required
      </Text>
      <Pressable style={styles.permsButton} onPress={askForPermissions}>
        <Text>Request</Text>
      </Pressable>
    </View>
  );
};

const ObjectFrame: React.FC<{ frame: Detection; index: number }> = ({
  frame,
  index,
}) => {
  const color = colorNames[index % colorNames.length];
  return (
    <Group style={"stroke"} strokeWidth={2}>
      <SkiaText
        x={frame.x}
        y={frame.y}
        color={color}
        text={frame.label}
        font={font}
      />
      <Rect
        key={index}
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        color={color}
      />
    </Group>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "red",
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
    padding: 10,
    backgroundColor: "lightblue",
    borderRadius: 5,
    margin: 10,
  },
  noPermsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
  },
  cameraSwitchButton: {
    position: "absolute",
    padding: 10,
    backgroundColor: "blue",
    borderRadius: 20,
    top: 20,
    right: 20,
  },
  cameraSwitchButtonText: {
    color: "white",
    fontSize: 16,
  },
});

const colorNames = [
  "Coral",
  "DarkCyan",
  "DeepSkyBlue",
  "ForestGreen",
  "GoldenRod",
  "MediumOrchid",
  "SteelBlue",
  "Tomato",
  "Turquoise",
  "SlateGray",
  "DodgerBlue",
  "FireBrick",
  "Gold",
  "HotPink",
  "LimeGreen",
  "Navy",
  "OrangeRed",
  "RoyalBlue",
  "SeaGreen",
  "Violet",
];

const fontFamily = Platform.select({ ios: "Helvetica", android: "sans-serif" });
const fontStyle = {
  fontFamily,
  fontSize: 14,
};
const font = matchFont(fontStyle);
