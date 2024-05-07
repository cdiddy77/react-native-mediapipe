import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text } from "react-native";
import type { RootTabParamList } from "./navigation";
import { useSettings } from "./app-settings";

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

export const Photo: React.FC<Props> = () => {
  const { settings } = useSettings();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Still Photo Placeholder</Text>
      <Text>Max Results: {settings.maxResults}</Text>
      <Text>Score Threshold: {settings.threshold}</Text>
      <Text>Model: {settings.model}</Text>
      <Text>Processor: {settings.processor}</Text>
    </View>
  );
};
