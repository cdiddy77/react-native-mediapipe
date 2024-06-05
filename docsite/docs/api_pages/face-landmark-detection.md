---
sidebar_position: 8
---

# Face Landmark Detection

Detects the main points of the face and its expressions in real time.

For more details or to demo it, visit 
[MediaPipe - Face Landmark Detection](https://mediapipe-studio.webapps.google.com/studio/demo/face_landmarker)

## How to get started 
** Using yarn **

**Requirements**
* Gradle minimum SDK 24 or higher
* Android-SDK Version 26 or higher
* iOS 12 or higher

1. **Open Terminal or Command Prompt:** Open your terminal or command prompt application. Create a brand new React Native Project. In this case we will be using **'eyetracker'** as on React Native MediaPipe Demo for example.

```
npx react-native init eyetracker
```

2. **Navigate to Your Project Directory:** Navigate to your React Native project directory on your environment.

3. **Install React Native MediaPipe:** Run the following command to install React Native MediaPipe and its dependencies:

```
yarn add react-native-mediapipe react-native-vision-camera react-native-worklets-core
```

```
yarn add @shopify/react-native-skia react-native-reanimated
```

4. **Configuring Babel:** Navigate to the 'babel.config.js' file and add:

``` jsx
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [['react-native-worklets-core/plugin']],
};
```

Updating Manifests

  5. **Configuring Gradle:** Navigate to the 'android/build.gradle' file and change minSdkVersion to 24
  :::warning

  **Gradle minimum SDK** must be 24 or higher to run

  :::

  ```
  buildscript {
      ext {
          ...
          minSdkVersion = 24 
          ...
      }
      ...
  }

  ```

  6. **Give Permissions:** Navigate to your AndroidManifest.xml file and add:

``` xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-feature ... >
    <uses-feature ... >

    <uses-permission android:name ="android.permission.INTERNET"/>
    <uses-permission android:name ="android.permission.CAMERA"/>
    ...
```

:::info

**You must change the main Android manifest file** not the debugging one

:::

**iOS:** Navigate to your **info.plist** file:

```jsx
// add this at line 11 right after the </script> tag

  <key>NSCameraUsageDescription</key>
  <string>$(PRODUCT_NAME) needs access to your Camera.</string>
```

7. **Terminal Commands:** In your terminal run the following commands

```
cd ios
bundle install
pod install
```

:::info
You will only need to run the bundle install command once.

:::

8. **Locate the configuration file**: Dowload and save the configuration file from [this link.](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker#models) and into your project.

**Android:** it goes into your 'assets' folder

```
mkdir android/app/src/main/assets
```
then 
```
cp ~/Downloads/face_landmarker.task android/app/src/main/assets/
```

**iOS:** *remainder* * eyetracker is the example project name we are currently using.

```
ls ios/eyetracker
```
then 
```
cp ~/Downloads/face_landmarker.task ios/eyetracker
```
*optional* * to make sure the file is in your project
```
ls ios/eyetracker
```

9. **Xcode Launching**:

> 1. Boot **Xcode** on your computer
> 2. Open existing project, in this case **eyetracker**
> 3. Go to to your **ios** folder
> 4. Choose the **eyetracker.xcworkspace**
> 5. Navigate to your **eyetracker** folder inside your **eyetracker** directory
> 6. Add the **face_landmarker.task** into your **eyetracker** folder

:::warning

Always use the file that ends on '.xcworkspace' on your xcode

:::


:::info

If you do pod install remember to close xcode, do pod install and restart the app. Because the pod install will change your file.

:::

10. **Run your app**:
```
cd ..
yarn start
yarn android

or

yarn ios
```

11. **Add Object Detection to your app**: once you see the default React Native welcome page on your device, change your **App.tsx** code to the following one

``` jsx
import {Canvas, Line, vec} from '@shopify/react-native-skia';
import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {
  Delegate,
  Dims,
  MediapipeCamera,
  Point,
  RunningMode,
  denormalizePoint,
  faceLandmarkDetectionModuleConstants,
  framePointToView,
  useFaceLandmarkDetection,
} from 'react-native-mediapipe';
import {useCameraPermission} from 'react-native-vision-camera';

// we are going to draw a series of line segments
type DrawSegment = {
  startPoint: Point;
  endPoint: Point;
};

// this code converts each segment from the "normalized" coordinate space
// that the face landmarks are in (0-1) to the "view" coordinate space
export function convertToViewSpace(
  segment: DrawSegment,
  frameSize: Dims,
  viewSize: Dims,
  mirrored = false,
): DrawSegment {
  return {
    startPoint: framePointToView(
      denormalizePoint(segment.startPoint, frameSize),
      frameSize,
      viewSize,
      'cover',
      mirrored,
    ),
    endPoint: framePointToView(
      denormalizePoint(segment.endPoint, frameSize),
      frameSize,
      viewSize,
      'cover',
      mirrored,
    ),
  };
}

const eyeLandmarks = {
  left: faceLandmarkDetectionModuleConstants().knownLandmarks.leftEye,
  right: faceLandmarkDetectionModuleConstants().knownLandmarks.rightEye,
};

function App(): React.JSX.Element {
  const cameraPermission = useCameraPermission();
  const [segments, setSegments] = React.useState<DrawSegment[]>([
    {startPoint: {x: 10, y: 10}, endPoint: {x: 100, y: 100}},
  ]);
  const faceDetection = useFaceLandmarkDetection(
    (results, viewSize, mirrored) => {
      const landmarks = results.results[0].faceLandmarks[0];
      if (!landmarks || landmarks.length === 0) {
        return;
      }
      console.log(
        JSON.stringify({
          infTime: results.inferenceTime,
          howManyLandmarks: landmarks.length,
        }),
      );
      const frameSize = {
        width: results.inputImageWidth,
        height: results.inputImageHeight,
      };

      // get all the segments for the eyes
      const leftEyeSegments: DrawSegment[] = eyeLandmarks.left.map(seg =>
        convertToViewSpace(
          {
            startPoint: landmarks[seg.start],
            endPoint: landmarks[seg.end],
          },
          frameSize,
          viewSize,
          mirrored,
        ),
      );
      const rightEyeSegments: DrawSegment[] = eyeLandmarks.right.map(seg =>
        convertToViewSpace(
          {
            startPoint: landmarks[seg.start],
            endPoint: landmarks[seg.end],
          },
          frameSize,
          viewSize,
          mirrored,
        ),
      );
      setSegments([leftEyeSegments, rightEyeSegments].flat());
    },
    error => {
      console.error(`onError: ${error}`);
    },
    RunningMode.LIVE_STREAM,
    'face_landmarker.task',
    {
      delegate: Delegate.GPU,
    },
  );

  return (
    <SafeAreaView style={styles.root}>
      {cameraPermission.hasPermission ? (
        <View style={styles.container}>
          <MediapipeCamera style={styles.camera} solution={faceDetection} />
          <Canvas style={styles.overlay}>
            {segments.map((segment, index) => (
              <Line
                key={index}
                p1={vec(segment.startPoint.x, segment.startPoint.y)}
                p2={vec(segment.endPoint.x, segment.endPoint.y)}
                color="red"
                style="stroke"
                strokeWidth={4}
              />
            ))}
          </Canvas>
        </View>
      ) : (
        <RequestPermissions
          hasCameraPermission={cameraPermission.hasPermission}
          requestCameraPermission={cameraPermission.requestPermission}
        />
      )}
    </SafeAreaView>
  );
}

const RequestPermissions: React.FC<{
  hasCameraPermission: boolean;
  requestCameraPermission: () => Promise<boolean>;
}> = ({hasCameraPermission, requestCameraPermission}) => {
  console.log(hasCameraPermission);
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to React Native Mediapipe</Text>
      <View style={styles.permissionsContainer}>
        {!hasCameraPermission && (
          <Text style={styles.permissionText}>
            React Native Mediapipe needs{' '}
            <Text style={styles.bold}>Camera permission</Text>.{' '}
            <Text style={styles.hyperlink} onPress={requestCameraPermission}>
              Grant
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'black',
  },
  welcome: {color: 'black', fontSize: 38, fontWeight: 'bold', maxWidth: '80%'},
  banner: {
    position: 'absolute',
    opacity: 0.4,
    bottom: 0,
    left: 0,
  },
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
    flexDirection: 'column',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoriesText: {color: 'black', fontSize: 36},
  permissionsContainer: {
    marginTop: 30,
  },
  permissionText: {
    color: 'black',
    fontSize: 17,
  },
  hyperlink: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default App;

```

12. **Reload app**: and grant acces to camera permissions
