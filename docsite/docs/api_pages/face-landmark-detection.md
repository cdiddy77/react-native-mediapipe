---
sidebar_position: 8
---

# Face Landmark Detection

### [`useFaceLandmarkDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L166 "Go to definition")

The [`useFaceLandmarkDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L166 "Go to definition") hook initializes and manages a Face Landmarking detection instance using the MediaPipe library. It provides a convenient way to set up face landmarking in a React Native application using the Vision Camera library.

For more details or to demo it, visit [MediaPipe - Face Landmark Detection](https://mediapipe-studio.webapps.google.com/studio/demo/face_landmarker)

#### Usage

```typescript
import { useFaceLandmarkDetection } from 'path/to/faceLandmarkDetection';

const faceDetection = useFaceLandmarkDetection(callbacks, runningMode, model, options);
```

#### Parameters

- [`callbacks`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L167 "Go to definition"): An object containing callback functions for handling detection results and errors.
  - [`onResults`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L147 "Go to definition"): A function that is called when face landmarking results are available.
  - [`onError`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L156 "Go to definition"): A function that is called when an error occurs during face landmarking.

- [`runningMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types.ts#L37 "Go to definition"): The mode in which the face landmarking should run. It can be one of the following:
  - [`RunningMode.IMAGE`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types.ts#L38 "Go to definition"): For detecting face landmarks in static images.
  - [`RunningMode.VIDEO`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types.ts#L39 "Go to definition"): For detecting face landmarks in video frames.
  - [`RunningMode.LIVE_STREAM`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types.ts#L34 "Go to definition"): For detecting face landmarks in a live camera stream.

- [`model`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L48 "Go to definition"): A string specifying the model to be used for face landmarking.

- [`options`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L122 "Go to definition") (optional): An object containing additional configuration options for the face landmarking. All properties are optional.
  - [`numFaces`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L130 "Go to definition"): The maximum number of faces to detect. Default is [`1`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L262 "Go to definition").
  - [`minFaceDetectionConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L131 "Go to definition"): The minimum confidence score for face detection. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L263 "Go to definition").
  - [`minFacePresenceConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L132 "Go to definition"): The minimum confidence score for face presence. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L264 "Go to definition").
  - [`minTrackingConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L45 "Go to definition"): The minimum confidence score for tracking. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L265 "Go to definition").
  - [`delegate`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L134 "Go to definition"): The delegate to be used for face landmarking. It can be one of the following:
    - [`Delegate.GPU`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types/index.ts#L33 "Go to definition"): Use GPU for face landmarking.
    - [`Delegate.CPU`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/shared/types/index.ts#L32 "Go to definition"): Use CPU for face landmarking.
  - [`mirrorMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L135 "Go to definition"): The mirror mode for the camera. It can be one of the following:
    - `"no-mirror"`: No mirroring.
    - `"mirror"`: Mirror the camera output.
    - `"mirror-front-only"`: Mirror the camera output only for the front camera. Default is `"mirror-front-only"`.
  - [`forceOutputOrientation`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L136 "Go to definition"): The orientation to force for the output image. It can be one of the following:
    - `"portrait"`
    - `"portrait-upside-down"`
    - `"landscape-left"`
    - `"landscape-right"`
  - [`forceCameraOrientation`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L137 "Go to definition"): The orientation to force for the camera image. It can be one of the following:
    - `"portrait"`
    - `"portrait-upside-down"`
    - `"landscape-left"`
    - `"landscape-right"`
  - [`fpsMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L138 "Go to definition"): The frame rate mode for the camera. It can be `"none"` or a number specifying the target frame rate.

#### Returns

An object containing the following properties:
- [`cameraViewLayoutChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L189 "Go to definition"): A function to handle layout changes for the camera view.
- [`cameraDeviceChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L331 "Go to definition"): A function to handle changes in the camera device.
- [`cameraOrientationChangedHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L334 "Go to definition"): A function to handle changes in the camera orientation.
- [`resizeModeChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L337 "Go to definition"): A function to handle changes in the resize mode.
- [`cameraViewDimensions`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L338 "Go to definition"): An object containing the dimensions of the camera view.
- [`frameProcessor`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L339 "Go to definition"): A function to process frames from the camera.

#### Example

```typescript
import React from 'react';
import { useFaceLandmarkDetection } from 'path/to/faceLandmarkDetection';
import { Camera } from 'react-native-vision-camera';

const FacelandmarkDetectionComponent = () => {
  const callbacks = {
    onResults: (results) => {
      console.log('Face Landmarking results:', results);
    },
    onError: (error) => {
      console.error('Face Landmarking error:', error);
    },
  };

  const faceLandmarkDetection = useFacelandmarkDetection(callbacks, 'LIVE_STREAM', 'face_landmarking.task', {
    // numFaces: 1,
    // minFaceDetectionConfidence: 0.5,
    // minFacePresenceConfidence: 0.5,
    // minTrackingConfidence: 0.5,
    // shouldOutputSegmentationMasks: false,
    // delegate: 'GPU',
    // mirrorMode: 'mirror-front-only',
    // forceOutputOrientation: 'portrait',
    // forceCameraOrientation: 'portrait',
    // fpsMode: 30,
  });

  return (
    <Camera
      style={{ flex: 1 }}
      device={faceLandmarkDetection.cameraDevice}
      onLayout={faceLandmarkDetection.cameraViewLayoutChangeHandler}
      frameProcessor={faceLandmarkDetection.frameProcessor}
      frameProcessorFps={faceLandmarkDetection.fpsMode}
    />
  );
};

export default FaceLandmarkDetectionComponent;
```

This documentation provides a comprehensive overview of the [`useFacelandmarkDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/faceLandmarkDetection/index.ts#L118 "Go to definition") hook, including its parameters, return values, and an example of how to use it in a React Native component.
```