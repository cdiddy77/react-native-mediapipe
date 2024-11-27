import React from "react";
import { Canvas, Points, type SkPoint } from "@shopify/react-native-skia";
import { type StyleProp, type ViewStyle } from "react-native";
import { useSharedValue, useDerivedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

export interface FaceDrawFrameProps {
  connections: SharedValue<SkPoint[]>;
  style?: StyleProp<ViewStyle>;
}

export const FaceDrawFrame: React.FC<FaceDrawFrameProps> = React.memo(
  ({ connections, style }) => {
    // Use derived value for reactive updates
    const points = useDerivedValue(() => {
      return connections.value;
    }, [connections]);

    return (
      <Canvas style={style}>
        <Points
          points={points}
          mode="lines"
          color={"lightblue"}
          style={"stroke"}
          strokeWidth={3}
        />
        <Points
          points={points}
          mode="points"
          color={"red"}
          style={"stroke"}
          strokeWidth={10}
          strokeCap={"round"}
        />
      </Canvas>
    );
  },
);

FaceDrawFrame.displayName = "FaceDrawFrame";
