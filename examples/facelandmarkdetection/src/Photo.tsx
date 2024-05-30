import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from "react-native-image-crop-picker";
import { objectDetectionOnImage, type Dims } from "react-native-mediapipe";
import { useSettings } from "./app-settings";

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

const PHOTO_SIZE: Dims = { width: 300, height: 400 };

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = React.useState<
    "initial" | "selecting" | "inferring" | "completed" | "error"
  >("initial");
  const { settings } = useSettings();
  const [imagePath, setImagePath] = React.useState<string>();
  const onClickSelectPhoto = async () => {
    setScreenState("selecting");
    try {
      const image = await ImagePicker.openPicker({
        mediaType: "photo",
        width: PHOTO_SIZE.width,
        height: PHOTO_SIZE.height,
      });
      const results = await objectDetectionOnImage(
        image.path,
        `${settings.model}.tflite`
      );
      const detections = results.results[0]?.detections ?? [];
      console.log(
        JSON.stringify({
          width: image.width,
          height: image.height,
          detections: detections.map((d) => ({
            bb: d.boundingBox,
            cat: d.categories[0]?.categoryName,
          })),
        })
      );
      setImagePath(image.path);
      setScreenState("completed");
    } catch (e) {
      console.error(e);
      setScreenState("error");
    }
  };

  // TODO : implement face landmark rendering
  return (
    <View style={styles.root}>
      {screenState === "initial" && (
        <Pressable style={styles.selectButton} onPress={onClickSelectPhoto}>
          <Text style={styles.selectButtonText}>Select a photo</Text>
        </Pressable>
      )}
      {screenState === "completed" && (
        <>
          <View style={styles.photoContainer}>
            <Image source={{ uri: imagePath }} style={styles.photo} />
          </View>
          <Pressable style={styles.selectButton} onPress={onClickSelectPhoto}>
            <Text style={styles.selectButtonText}>Select a new photo</Text>
          </Pressable>
        </>
      )}
      {screenState === "error" && (
        <>
          <Text style={styles.errorText}>Error! Please try again.</Text>
          <Pressable style={styles.selectButton} onPress={onClickSelectPhoto}>
            <Text style={styles.selectButtonText}>Select a photo</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  selectButton: { backgroundColor: "blue", padding: 10, borderRadius: 5 },
  selectButtonText: { fontSize: 20, color: "white" },
  photoContainer: { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  errorText: { fontSize: 30, color: "red" },
});
