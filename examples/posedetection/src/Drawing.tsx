import React from "react";
import { Canvas, Points, type SkPoint } from "@shopify/react-native-skia";
import { type StyleProp, type ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

export interface PoseDrawFrameProps {
  connections: SharedValue<SkPoint[]>;
  style?: StyleProp<ViewStyle>;
}
export const PoseDrawFrame: React.FC<PoseDrawFrameProps> = (props) => {
  return (
    <Canvas style={props.style}>
      <Points
        points={props.connections}
        mode="lines"
        color={"lightblue"}
        style={"stroke"}
        strokeWidth={3}
      />
      <Points
        points={props.connections}
        mode="points"
        color={"red"}
        style={"stroke"}
        strokeWidth={10}
        strokeCap={"round"}
      />
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

export type ColorName = (typeof COLOR_NAMES)[number];
