---
sidebar_position: 9
---

# Pose Landmark Detection

### [`usePoseDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L118 "Go to definition")

The [`usePoseDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L118 "Go to definition") hook initializes and manages a pose detection instance using the MediaPipe library. It provides a convenient way to set up pose detection in a React Native application using the Vision Camera library.

#### Usage

```typescript
import { usePoseDetection } from 'path/to/poseDetection';

const poseDetection = usePoseDetection(callbacks, runningMode, model, options);
```

#### Parameters

- [`callbacks`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L102 "Go to definition"): An object containing callback functions for handling detection results and errors.
  - [`onResults`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L104 "Go to definition"): A function that is called when pose detection results are available.
  - [`onError`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L113 "Go to definition"): A function that is called when an error occurs during pose detection.

- [`runningMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L49 "Go to definition"): The mode in which the pose detection should run. It can be one of the following:
  - [`RunningMode.IMAGE`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/android/src/main/java/com/reactnativemediapipe/posedetection/PoseDetectionModule.kt#L99 "Go to definition"): For detecting poses in static images.
  - [`RunningMode.VIDEO`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L18 "Go to definition"): For detecting poses in video frames.
  - [`RunningMode.LIVE_STREAM`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L18 "Go to definition"): For detecting poses in a live camera stream.

- [`model`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L47 "Go to definition"): A string specifying the model to be used for pose detection.

- [`options`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L122 "Go to definition") (optional): An object containing additional configuration options for the pose detection. All properties are optional.
  - [`numPoses`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L42 "Go to definition"): The maximum number of poses to detect. Default is [`1`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L131 "Go to definition").
  - [`minPoseDetectionConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L43 "Go to definition"): The minimum confidence score for pose detection. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L220 "Go to definition").
  - [`minPosePresenceConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L44 "Go to definition"): The minimum confidence score for pose presence. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L220 "Go to definition").
  - [`minTrackingConfidence`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L45 "Go to definition"): The minimum confidence score for pose tracking. Default is [`0.5`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L220 "Go to definition").
  - [`shouldOutputSegmentationMasks`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L46 "Go to definition"): A boolean indicating whether to output segmentation masks. Default is [`false`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L176 "Go to definition").
  - [`delegate`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L48 "Go to definition"): The delegate to be used for pose detection. It can be one of the following:
    - [`Delegate.GPU`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L16 "Go to definition"): Use GPU for pose detection.
    - [`Delegate.CPU`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L16 "Go to definition"): Use CPU for pose detection.
  - [`mirrorMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L82 "Go to definition"): The mirror mode for the camera. It can be one of the following:
    - `"no-mirror"`: No mirroring.
    - `"mirror"`: Mirror the camera output.
    - `"mirror-front-only"`: Mirror the camera output only for the front camera. Default is `"mirror-front-only"`.
  - [`forceOutputOrientation`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L83 "Go to definition"): The orientation to force for the output image. It can be one of the following:
    - `"portrait"`
    - `"portrait-upside-down"`
    - `"landscape-left"`
    - `"landscape-right"`
  - [`forceCameraOrientation`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L84 "Go to definition"): The orientation to force for the camera image. It can be one of the following:
    - `"portrait"`
    - `"portrait-upside-down"`
    - `"landscape-left"`
    - `"landscape-right"`
  - [`fpsMode`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L85 "Go to definition"): The frame rate mode for the camera. It can be `"none"` or a number specifying the target frame rate.

#### Returns

An object containing the following properties:
- [`cameraViewLayoutChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L133 "Go to definition"): A function to handle layout changes for the camera view.
- [`cameraDeviceChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L306 "Go to definition"): A function to handle changes in the camera device.
- [`cameraOrientationChangedHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L312 "Go to definition"): A function to handle changes in the camera orientation.
- [`resizeModeChangeHandler`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L316 "Go to definition"): A function to handle changes in the resize mode.
- [`cameraViewDimensions`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L128 "Go to definition"): An object containing the dimensions of the camera view.
- [`frameProcessor`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L262 "Go to definition"): A function to process frames from the camera.

#### Example

```typescript
import React from 'react';
import { usePoseDetection } from 'path/to/poseDetection';
import { Camera } from 'react-native-vision-camera';

const PoseDetectionComponent = () => {
  const callbacks = {
    onResults: (results) => {
      console.log('Pose detection results:', results);
    },
    onError: (error) => {
      console.error('Pose detection error:', error);
    },
  };

  const poseDetection = usePoseDetection(callbacks, 'LIVE_STREAM', 'pose_model', {
    // numPoses: 1,
    // minPoseDetectionConfidence: 0.5,
    // minPosePresenceConfidence: 0.5,
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
      device={poseDetection.cameraDevice}
      onLayout={poseDetection.cameraViewLayoutChangeHandler}
      frameProcessor={poseDetection.frameProcessor}
      frameProcessorFps={poseDetection.fpsMode}
    />
  );
};

export default PoseDetectionComponent;
```

This documentation provides a comprehensive overview of the [`usePoseDetection`](https://github.com/cdiddy77/react-native-mediapipe/blob/main/src/poseDetection/index.ts#L118 "Go to definition") hook, including its parameters, return values, and an example of how to use it in a React Native component.
```