import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from "react-native-image-crop-picker";
import { objectDetectionOnImage, type Dims } from "react-native-mediapipe";
import { useSettings } from "./app-settings";
import {
  faceLandmarkDetectionModuleConstants,
  useFaceLandmarkDetection,
  type FaceLandmarksModuleConstants,
  RunningMode,
  type FaceLandmarkDetectionResultBundle,
} from "react-native-mediapipe";
import { FaceDrawFrame, convertLandmarksToSegments, type FaceSegment } from "./Drawing";

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

const PHOTO_SIZE: Dims = { width: 300, height: 400 };

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = useState<
    "initial" | "selecting" | "inferring" | "completed" | "error"
  >("initial");
  const { settings } = useSettings();
  const [imagePath, setImagePath] = useState<string>();
  const [faceLandmarks] = useState<FaceLandmarksModuleConstants["knownLandmarks"]>(
    faceLandmarkDetectionModuleConstants().knownLandmarks
  );
  const [faceSegments, setFaceSegments] = useState<FaceSegment[]>([]);

  const onFaceDetectionResults = useCallback((
    results: FaceLandmarkDetectionResultBundle,
    viewSize: Dims,
    mirrored: boolean
  ) => {
    if (results.results.length === 0) {
      setFaceSegments([]);
      return;
    }
    const firstResult = results.results[0];
    const segments = firstResult.faceLandmarks.length > 0
      ? [
          ...convertLandmarksToSegments(
            firstResult.faceLandmarks[0],
            faceLandmarks.lips,
            "FireBrick",
            {
              width: results.inputImageWidth,
              height: results.inputImageHeight,
            },
            { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
            mirrored
          ),
          ...convertLandmarksToSegments(
            firstResult.faceLandmarks[0],
            faceLandmarks.leftEye,
            "ForestGreen",
            {
              width: results.inputImageWidth,
              height: results.inputImageHeight,
            },
            { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
            mirrored
          ),
          ...convertLandmarksToSegments(
            firstResult.faceLandmarks[0],
            faceLandmarks.rightEye,
            "ForestGreen",
            {
              width: results.inputImageWidth,
              height: results.inputImageHeight,
            },
            { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
            mirrored
          ),
          ...convertLandmarksToSegments(
            firstResult.faceLandmarks[0],
            faceLandmarks.leftEyebrow,
            "Coral",
            {
              width: results.inputImageWidth,
              height: results.inputImageHeight,
            },
            { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
            mirrored
          ),
          ...convertLandmarksToSegments(
            firstResult.faceLandmarks[0],
            faceLandmarks.rightEyebrow,
            "Coral",
            {
              width: results.inputImageWidth,
              height: results.inputImageHeight,
            },
            { width: PHOTO_SIZE.width, height: PHOTO_SIZE.height },
            mirrored
          ),
        ]
      : [];

    console.log(JSON.stringify({ infTime: results.inferenceTime }));
    setFaceSegments(segments);
  }, [faceLandmarks]);

  const onFaceDetectionError = useCallback((error: unknown) => {
    console.error(`onError: ${error}`);
  }, []);

  const faceDetection = useFaceLandmarkDetection(
    onFaceDetectionResults,
    onFaceDetectionError,
    RunningMode.IMAGE,
    "face_landmarker.task",
    {
      delegate: settings.processor,
    }
  );

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

      // Perform face landmark detection
      faceDetection.detect(image.path); // Ensure detect is a method of faceDetection

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
            <FaceDrawFrame
              style={StyleSheet.absoluteFill}
              facePoints={[]}
              faceSegments={faceSegments}
            />
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

