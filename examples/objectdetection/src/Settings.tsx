import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text } from "react-native";
import type { RootTabParamList } from "./navigation";

type Props = BottomTabScreenProps<RootTabParamList, "Settings">;

export const Settings: React.FC<Props> = () => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Settings Placeholder</Text>
    </View>
  );
};
