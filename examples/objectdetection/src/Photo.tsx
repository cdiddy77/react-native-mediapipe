import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from "react-native-image-crop-picker";
import { objectDetectionOnImage, type Dims } from "react-native-mediapipe";
import { useSettings } from "./app-settings";
import { Canvas } from "@shopify/react-native-skia";
import { CustomColors } from "./colors";
import {
  ObjectFrame,
  convertObjectDetectionFrame,
  type ObjectDetectionFrame,
} from "./Drawing";

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

const PHOTO_SIZE: Dims = { width: 300, height: 400 };

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = React.useState<
    "initial" | "selecting" | "inferring" | "completed" | "error"
  >("initial");
  const { settings } = useSettings();
  const [imagePath, setImagePath] = React.useState<string>();
  const [objectFrames, setObjectFrames] = React.useState<
    ObjectDetectionFrame[]
  >([]);
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
      const frameSize = {
        width: results.inputImageWidth,
        height: results.inputImageHeight,
      };
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
      setObjectFrames(
        detections.map((r) =>
          convertObjectDetectionFrame(r, frameSize, PHOTO_SIZE)
        )
      );
      setImagePath(image.path);
      setScreenState("completed");
    } catch (e) {
      console.error(e);
      setScreenState("error");
    }
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
            <Canvas style={styles.objectsOverlay}>
              {objectFrames.map((frame, index) => (
                <ObjectFrame frame={frame} index={index} key={index} />
              ))}
            </Canvas>
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
          <Text style={styles.errorInfoText}>Please make sure you have selected a photo.</Text>
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
    borderRadius: 5 },

  selectButtonText: { 
    fontSize: 20,
    color: "black", 
    fontWeight: "bold",
  },

  photoContainer: { 
    width: PHOTO_SIZE.width, 
    height: PHOTO_SIZE.height },

  photo: { 
    position: "absolute", 
    top: 0, left: 0, 
    right: 0, 
    bottom: 0 },

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
   
  }
    
});
