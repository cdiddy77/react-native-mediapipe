import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RootTabParamList } from "./navigation";
import Slider from "@react-native-community/slider";
import RNPickerSelect from "react-native-picker-select";
import { Delegate } from "react-native-mediapipe";
import { useSettings } from "./app-settings";

type SlidersComponentProps = {
  label: (value: number) => string;
  value: number;
  setValue: (value: number) => void;
  minValue?: number;
  maxValue?: number;
};

type SelectComponentProps = {
  label: string;
  value: unknown;
  setValue: (value: unknown) => void;
  items: { label: string; value: unknown }[];
};

const OptionSlider: React.FC<SlidersComponentProps> = ({
  label,
  value,
  setValue,
  minValue = 1,
  maxValue = 10,
}) => {
  const [curValue, setCurValue] = React.useState(value);
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label(curValue)}</Text>
      <Slider
        value={curValue}
        onValueChange={setCurValue}
        onSlidingComplete={setValue}
        minimumValue={minValue}
        maximumValue={maxValue}
        step={1}
        style={styles.slider}
      />
    </View>
  );
};

const OptionSelect: React.FC<SelectComponentProps> = ({
  label,
  value,
  setValue,
  items,
}) => {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <RNPickerSelect
        value={value}
        onValueChange={setValue}
        style={{ inputAndroid: styles.picker, inputIOS: styles.picker }}
        useNativeAndroidPickerStyle={false}
        items={items}
      />
    </View>
  );
};

type Props = BottomTabScreenProps<RootTabParamList, "Settings">;

export const Settings: React.FC<Props> = () => {
  const { settings, setSettings } = useSettings();

  return (
    <View style={styles.container}>
      <OptionSelect
        label="Processor: "
        value={settings.processor}
        setValue={(value) =>
          setSettings({ ...settings, processor: value as Delegate })
        }
        items={[
          { label: "GPU", value: Delegate.GPU },
          { label: "CPU", value: Delegate.CPU },
        ]}
      />
      <OptionSelect
        label="Model selections: "
        value={settings.model}
        setValue={(value) =>
          setSettings({ ...settings, model: value as string })
        }
        items={[
          { label: "Lite", value: "pose_landmarker_lite" },
          { label: "Full", value: "pose_landmarker_full" },
          { label: "Heavy", value: "pose_landmarker_heavy" },
        ]}
      />
      <OptionSlider
        label={(value) => `Max results: ${value}`}
        value={settings.maxResults}
        setValue={(value) => setSettings({ ...settings, maxResults: value })}
      />
      <OptionSlider
        label={(value) => `Score threshold: ${value}%`}
        value={settings.threshold}
        setValue={(value) => setSettings({ ...settings, threshold: value })}
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
  slider: { width: 250, height: 40 },
  picker: { width: 250, height: 40, marginLeft: 15 },
  label: { marginLeft: 15 },
});
