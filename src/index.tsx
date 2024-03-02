import React from "react";
import { type ViewStyle, View, Text } from "react-native";

type MediapipeProps = {
  color: string;
  style: ViewStyle;
};

export const MediapipeCamera: React.FC<MediapipeProps> = ({ color }) => {
  return (
    <View>
      <Text style={{ color, fontSize: 20 }}>MediapipeCamera</Text>
    </View>
  );
};
