import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from "react-native-image-crop-picker";
import { CustomColors } from "./colors";
import {
  faceLandmarkDetectionModuleConstants,
  type FaceLandmarksModuleConstants,
  type Dims,
  faceLandmarkDetectionOnImage,
} from "react-native-mediapipe";
import { FaceDrawFrame } from "./Drawing";

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

const PHOTO_SIZE: Dims = { width: 300, height: 400 };

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = useState<
    "initial" | "selecting" | "inferring" | "completed" | "error"
  >("initial");
  const [imagePath, setImagePath] = useState<string>();
  const [faceLandmarks] = useState<
    FaceLandmarksModuleConstants["knownLandmarks"]
  >(faceLandmarkDetectionModuleConstants().knownLandmarks);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const onClickSelectPhoto = async () => {
    console.log("adsf");
  };

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
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error!</Text>
            <Text style={styles.errorInfoText}>{errorMessage}</Text>
          </View>
          <Pressable style={styles.selectButton} onPress={onClickSelectPhoto}>
            <Text style={styles.selectButtonText}>Select a photo</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CustomColors.backgroundGrayBlue,
  },
  selectButton: {
    backgroundColor: CustomColors.elecBlue,
    padding: 15.5,
    paddingRight: 25,
    paddingLeft: 25,
    borderRadius: 5,
  },
  selectButtonText: {
    fontSize: 20,
    color: "black",
    fontWeight: "bold",
  },
  photoContainer: {
    position: "relative",
    width: PHOTO_SIZE.width,
    height: PHOTO_SIZE.height,
  },
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  objectsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorText: {
    fontSize: 25,
    color: "black",
    bottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorInfoText: {
    fontSize: 15.5,
    color: CustomColors.teal,
  },
  errorBox: {
    backgroundColor: CustomColors.lightGray,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CustomColors.teal,
    bottom: 25,
  },
});
