import React from "react";
import { Canvas, Line, vec } from "@shopify/react-native-skia";
import { type StyleProp, type ViewStyle } from "react-native";
import {
  denormalizePoint,
  framePointToView,
  type Dims,
  type Landmark,
  type FaceLandmarkConnection,
  type Point,
} from "react-native-mediapipe";

export interface FacePoint {
  x: number;
  y: number;
  color: ColorName;
}

export interface FaceSegment {
  startPoint: Point;
  endPoint: Point;
  color: ColorName;
}

export interface FaceDrawFrameProps {
  facePoints: FacePoint[];
  faceSegments: FaceSegment[];
  style?: StyleProp<ViewStyle>;
}
export const FaceDrawFrame: React.FC<FaceDrawFrameProps> = (props) => {
  return (
    <Canvas style={props.style}>
      {props.faceSegments.map((segment, index) => (
        <Line
          key={index}
          p1={vec(segment.startPoint.x, segment.startPoint.y)}
          p2={vec(segment.endPoint.x, segment.endPoint.y)}
          color={segment.color}
          style="stroke"
          strokeWidth={4}
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

export function convertLandmarksToSegments(
  landmarks: Landmark[],
  positions: FaceLandmarkConnection[],
  color: ColorName,
  frameSize: { width: number; height: number },
  viewSize: Dims,
  mirrored = false
): FaceSegment[] {
  return positions.map(({ start, end }) => ({
    startPoint: framePointToView(
      denormalizePoint(landmarks[start], frameSize),
      frameSize,
      viewSize,
      "cover",
      mirrored
    ),
    endPoint: framePointToView(
      denormalizePoint(landmarks[end], frameSize),
      frameSize,
      viewSize,
      "cover",
      mirrored
    ),
    color,
  }));
}
