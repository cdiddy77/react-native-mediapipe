import React from "react";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";
import { type StyleProp, type ViewStyle } from "react-native";
import { type Point } from "react-native-mediapipe";

export interface PoseDrawFrameProps {
  points: Point[];
  lines: [Point, Point][];
  style?: StyleProp<ViewStyle>;
}
export const PoseDrawFrame: React.FC<PoseDrawFrameProps> = (props) => {
  return (
    <Canvas style={props.style}>
      {props.lines.map((segment, index) => (
        <Line
          key={index}
          p1={vec(segment[0].x, segment[0].y)}
          p2={vec(segment[1].x, segment[1].y)}
          color="ForestGreen"
          style="stroke"
          strokeWidth={4}
        />
      ))}
      {props.points.map((p, index) => (
        <Circle
          key={index}
          cx={p.x}
          cy={p.y}
          r={5}
          color="red"
          strokeWidth={3}
          style="stroke"
        />
      ))}
    </Canvas>
  );
};

const COLOR_NAMES = [
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
] as const;

type ColorName = (typeof COLOR_NAMES)[number];
