import {
  Canvas,
  Group,
  Rect,
  Skia,
  Paragraph,
  TextAlign,
  matchFont,
} from "@shopify/react-native-skia";
import * as React from "react";

import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  MediapipeCamera,
  RunningMode,
  useObjectDetection,
  clampToDims,
  frameRectToView,
  ltrbToXywh,
} from "react-native-mediapipe";

import {
  useCameraPermission,
  useMicrophonePermission,
  type CameraPosition,
} from "react-native-vision-camera";
import type { RootTabParamList } from "./navigation";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useSettings } from "./app-settings";
import { useDebounce } from "./useDebounce";
import Ionicons from "react-native-vector-icons/Ionicons";

interface Detection {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Props = BottomTabScreenProps<RootTabParamList, "CameraStream">;

export const CameraStream: React.FC<Props> = () => {
  const { settings } = useSettings();
  const debouncedSettings = useDebounce(settings, 500);
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
    (results, viewSize, mirrored) => {
      const firstResult = results.results[0];
      const detections = firstResult?.detections ?? [];
      const frameSize = {
        width: results.inputImageWidth,
        height: results.inputImageHeight,
      };
      setObjectFrames(
        detections.map((detection) => {
          const { x, y, width, height } = clampToDims(
            frameRectToView(
              ltrbToXywh(detection.boundingBox),
              frameSize,
              viewSize,
              "cover",
              mirrored
            ),
            viewSize
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
    `${debouncedSettings.model}.tflite`,
    {
      delegate: debouncedSettings.processor,
      maxResults: debouncedSettings.maxResults,
      threshold: debouncedSettings.threshold / 100,
    }
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
          <>
          <Ionicons name="repeat-outline" />
          </>
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

const ObjectFrame: React.FC<{ frame: Detection; index: number }> = ({
  frame,
  index,
}) => {
  const color = colorNames[index % colorNames.length];
  if (color === undefined) {
    throw new Error(`No color found for index ${index}`);
  }
  const paragraph = React.useMemo(() => {
    const textStyle = {
      backgroundColor: Skia.Color(color),
      color: Skia.Color(textfromBackground(color)),
      font: font,
      fontSize: 24,
    };
    const para = Skia.ParagraphBuilder.Make({
      textAlign: TextAlign.Right,
    })
      .pushStyle(textStyle)
      .addText(` ${frame.label} `)
      .build();
    return para;
  }, [frame.label, color]);

  return (
    <Group style={"stroke"} strokeWidth={2}>
      <Paragraph
        paragraph={paragraph}
        x={frame.x}
        y={frame.y}
        color={color}
        width={frame.width}
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

function textfromBackground(background: string): string {
  const color = Skia.Color(background);
  const red = (color[0] ?? 0) * 256;
  const green = (color[1] ?? 0) * 256;
  const blue = (color[2] ?? 0) * 256;

  // use the algorithm from https://stackoverflow.com/a/3943023/2197085
  const text =
    red * 0.299 + green * 0.587 + blue * 0.114 > 186 ? "black" : "white";

  return text;
}

const fontFamily = Platform.select({ ios: "Helvetica", android: "sans-serif" });
const fontStyle = {
  fontFamily,
  fontSize: 24,
};
const font = matchFont(fontStyle);
