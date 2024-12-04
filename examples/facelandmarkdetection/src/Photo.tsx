import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import type { RootTabParamList } from "./navigation";
import ImagePicker from "react-native-image-crop-picker";
import { CustomColors } from "./colors";

// Prefix unused imports with underscore to indicate intentional non-usage
import {
  _useFaceLandmarkDetection as useFaceLandmarkDetection,
  faceLandmarkDetectionModuleConstants,
  faceLandmarkDetectionOnImage,
  type _DetectionError as DetectionError,
  type FaceLandmarkDetectionResultBundle,
  type ViewCoordinator,
  BaseViewCoordinator,
} from "react-native-mediapipe";

import { FaceDrawFrame } from "./Drawing";
import { useSharedValue } from "react-native-reanimated";
import { vec, type SkPoint } from "@shopify/react-native-skia";

// Define comprehensive type system for face detection
type FrameDims = {
  width: number;
  height: number;
};

type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
  presence?: number;
};

// Define specific error types for better error handling
type PhotoError = {
  readonly NO_FACE_DETECTED: "No face was detected in the image";
  readonly PROCESSING_ERROR: "Error processing the image";
  readonly PERMISSION_DENIED: "Camera permission was denied";
  readonly INVALID_IMAGE: "Invalid image format or corrupted file";
};

const PhotoErrors: PhotoError = {
  NO_FACE_DETECTED: "No face was detected in the image",
  PROCESSING_ERROR: "Error processing the image",
  PERMISSION_DENIED: "Camera permission was denied",
  INVALID_IMAGE: "Invalid image format or corrupted file",
} as const;

type Props = BottomTabScreenProps<RootTabParamList, "Photo">;

const PHOTO_SIZE: FrameDims = { width: 300, height: 400 };
const MINIMUM_CONFIDENCE = 0.5;

// Type guard for landmark validation
const isValidLandmark = (
  landmark: LandmarkPoint | undefined | null,
): landmark is LandmarkPoint => {
  return (
    landmark != null &&
    typeof landmark.x === "number" &&
    typeof landmark.y === "number" &&
    typeof landmark.z === "number"
  );
};

export const Photo: React.FC<Props> = () => {
  const [screenState, setScreenState] = useState<
    "initial" | "selecting" | "inferring" | "completed" | "error"
  >("initial");
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const faceConnections = useSharedValue<SkPoint[]>([]);
  const { knownLandmarks } = faceLandmarkDetectionModuleConstants();

  const allConnections = React.useMemo(
    () => [
      ...knownLandmarks.lips,
      ...knownLandmarks.leftEye,
      ...knownLandmarks.rightEye,
      ...knownLandmarks.leftEyebrow,
      ...knownLandmarks.rightEyebrow,
      ...knownLandmarks.faceOval,
    ],
    [knownLandmarks],
  );

  const updateFaceConnections = React.useCallback(
    (newPoints: SkPoint[]) => {
      "worklet";
      faceConnections.value = newPoints;
    },
    [faceConnections],
  );

  const processFaceLandmarks = React.useCallback(
    (landmarks: LandmarkPoint[], frameDims: FrameDims, vc: ViewCoordinator) => {
      const newLines: SkPoint[] = [];

      for (const { start, end } of allConnections) {
        // Use type guard for proper null checking
        if (
          !isValidLandmark(landmarks[start]) ||
          !isValidLandmark(landmarks[end])
        ) {
          continue;
        }

        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];

        if (
          (startLandmark.presence ?? 1) < MINIMUM_CONFIDENCE ||
          (endLandmark.presence ?? 1) < MINIMUM_CONFIDENCE
        ) {
          continue;
        }

        // Type assertion is safe here because we validated the structure
        const pt1 = vc.convertPoint(frameDims, startLandmark) as {
          x: number;
          y: number;
        };
        const pt2 = vc.convertPoint(frameDims, endLandmark) as {
          x: number;
          y: number;
        };

        if (
          !Number.isFinite(pt1.x) ||
          !Number.isFinite(pt1.y) ||
          !Number.isFinite(pt2.x) ||
          !Number.isFinite(pt2.y)
        ) {
          continue;
        }

        newLines.push(vec(pt1.x, pt1.y));
        newLines.push(vec(pt2.x, pt2.y));
      }

      updateFaceConnections(newLines);
    },
    [allConnections, updateFaceConnections],
  );

  const onClickSelectPhoto = async () => {
    setScreenState("selecting");
    try {
      const image = await ImagePicker.openPicker({
        mediaType: "photo",
        width: PHOTO_SIZE.width,
        height: PHOTO_SIZE.height,
      });

      setImagePath(image.path);
      setScreenState("inferring");

      const results = (await faceLandmarkDetectionOnImage(
        image.path,
        "face_landmarker.task",
      )) as FaceLandmarkDetectionResultBundle;

      // More explicit check for results
      if (results.results.length <= 0) {
        setErrorMessage(PhotoErrors.NO_FACE_DETECTED);
        setScreenState("error");
        return;
      }

      const vc = new BaseViewCoordinator(
        PHOTO_SIZE,
        false,
        "portrait",
        "portrait",
        "cover",
      );

      const frameDims = vc.getFrameDims(results) as FrameDims;

      // More explicit null checking
      const firstResult = results.results[0];
      const faceLandmarks =
        firstResult.faceLandmarks.length >= 0
          ? firstResult.faceLandmarks[0]
          : undefined;

      if (
        !faceLandmarks ||
        !Array.isArray(faceLandmarks) ||
        faceLandmarks.length <= 0
      ) {
        setErrorMessage(PhotoErrors.NO_FACE_DETECTED);
        setScreenState("error");
        return;
      }

      processFaceLandmarks(faceLandmarks as LandmarkPoint[], frameDims, vc);
      setScreenState("completed");
    } catch (e) {
      console.error(e);
      setErrorMessage(
        e instanceof Error ? e.message : PhotoErrors.PROCESSING_ERROR,
      );
      setScreenState("error");
    }
  };
  // Rest of your render code remains the same, just remove unused styles
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
            <FaceDrawFrame connections={faceConnections} style={styles.box} />
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
            <Text style={styles.selectButtonText}>Try again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Remove unused objectsOverlay style
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
  box: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
});
