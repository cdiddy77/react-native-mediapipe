import React from "react";
import {
  Group,
  Rect,
  Skia,
  Paragraph,
  TextAlign,
  matchFont,
} from "@shopify/react-native-skia";
import { Platform } from "react-native";
import {
  clampToDims,
  frameRectToView,
  ltrbToXywh,
  type DetectionMap,
  type Dims,
} from "react-native-mediapipe";

export interface ObjectDetectionFrame {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ObjectFrame: React.FC<{
  frame: ObjectDetectionFrame;
  index: number;
}> = ({ frame, index }) => {
  const color = colorNames[index % colorNames.length];
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
  const red = color[0] * 256;
  const green = color[1] * 256;
  const blue = color[2] * 256;

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

export function convertObjectDetectionFrame(
  detection: DetectionMap,
  frameSize: { width: number; height: number },
  viewSize: Dims,
  mirrored = false
): ObjectDetectionFrame {
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
}
