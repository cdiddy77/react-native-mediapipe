import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RootTabParamList } from "./navigation";
import Slider from "@react-native-community/slider";

type SlidersComponentProps = {
  label: string;
  value: number;
  setValue: (value: number) => void;
  minValue?: number;
  maxValue?: number;
};

const OptionSlider: React.FC<SlidersComponentProps> = ({
  label,
  value,
  setValue,
  minValue = 1,
  maxValue = 10,
}) => {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>
        {label.replace("${value}", value.toString())}
      </Text>
      <Slider
        value={value}
        onValueChange={setValue}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={1}
        style={styles.slider}
      />
    </View>
  );
};

type Props = BottomTabScreenProps<RootTabParamList, "Settings">;

export const Settings: React.FC<Props> = () => {
  const [maxResults, setMaxResults] = React.useState(5);
  const [threshold, setThreshold] = React.useState(0);

  return (
    <View style={styles.container}>
      <OptionSlider
        label="Max results: ${value}"
        value={maxResults}
        setValue={setMaxResults}
      />
      <OptionSlider
        label="Score threshold: ${value}%"
        value={threshold}
        setValue={setThreshold}
        minValue={0}
        maxValue={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    position: "relative",
  },
  item: { padding: 10 },
  slider: { width: 200 },
  label: { marginLeft: 15 },
});
