---
sidebar_position: 1
---

# Object Detection

Tracks and categorize objects via your camera mobile.

For more details or to demo it, visit 
[MediaPipe - Object Detection](https://mediapipe-studio.webapps.google.com/studio/demo/object_detector)


## How to get started
** Using yarn **

**Requirements**
* Gradle minimum SDK 24 or higher
* Android-SDK Version 26 or higher
* iOS 12 or higher

1. **Open Terminal or Command Prompt:** Open your terminal or command prompt application. Create a brand new React Native Project. In this case we will be using **'rnmpdemo'** as on React Native MediaPipe Demo for example.

```
npx react-native init rnmpdemo
```

2. **Navigate to Your Project Directory:** Navigate to your React Native project directory on your environment.

3. **Install React Native MediaPipe:** Run the following command to install React Native MediaPipe and its dependencies:

```
yarn add react-native-mediapipe react-native-vision-camera react-native-worklets-core
```

    If correctly you should see a **react-native-mediapipe** dropdown inside **node_modules** 


4. **Configuring Babel:** Navigate to the 'babel.config.js' file and add:

``` jsx
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [['react-native-worklets-core/plugin']],
};
```

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Configuring to your Operating System

<Tabs>
  <TabItem value="Android" label="Android" default>

  1. **Configuring Gradle:** Navigate to the 'android/build.gradle' file and change minSdkVersion to 24
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

  2. **Give Permissions:** Navigate to your AndroidManifest.xml file and add:

``` xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-feature ... >
    <uses-feature ... >

    <uses-permission android:name ="andoird.permission.INTERNET">
    <uses-permission android:name ="andoird.permission.CAMERA">
    ...
```

:::info

**You must change the main Android manifest file** not the debugging one

:::

3. **Create an 'assets' folder**: inside **main** on your 'src' directory from your android section

:::warning

Make sure you name your folder **assets** for the configuration to work

:::


4. **Locate the configuration file**: download from this link and into the 'assets' folder

 > 1. Dowload and save the configuration file from [this link.](https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector#efficientdet-lite0_model_recommended)
 > 2. Navigate to the folder where file was saved.
 > 3. Locate the file named **"efficientdet_lite0.tflite"**.
 > 4. Drag and drop or copy and paste the file into the **"assets"** folder.

5. **Run your app**:
```
cd ..
yarn start
yarn android
```

  </TabItem>

  <TabItem value="iOS" label="iOS">
1. **Give Permissions:** Navigate to your info.plist file in the outermost tag:

```jsx
// add this at the end of your file before the closing </dict> tag

  <key>NSCameraUsageDescription</key>
  <string>$(PRODUCT_NAME) needs access to your Camera.</string>
```


2. **Terminal Commands:** In your terminal run the following commands

:::info
You will only need to run the bundle install command once.

:::

```
cd ios
bundle install
pod install
```

3. **Locate the configuration file**: download from this link and into your project folder. In this case your 'rnmpdemo' folder

 > 1. Dowload and save the configuration file from [this link.](https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector#efficientdet-lite0_model_recommended)
 > 2. Navigate to the folder where file was saved.
 > 3. Locate the file named **"efficientdet_lite0.tflite"**.
 > 4. Drag and drop or copy and paste the file into the **rnmpdemo** folder.

4. **Xcode Launching**:

> 1. Boot **Xcode** on your computer
> 2. Open existing project, in this case **rnmpdemo**
> 3. Go to to your **ios** folder
> 4. Choose the **rnmpdemo.xcworkspace**
> 5. Navigate to your **rnmpdemo** folder inside your **rnmpdemo** directory
> 6. Add the **efficientdet_lite0.tflite** into your **rnmpdemo** folder

:::warning

Always use the file that ends on '.xcworkspace' on your xcode

:::


:::info

If you do pod install remember to close xcode, do pod install and restart the app. Because the pod install will change your file.

:::

5. **Run your app**:
```
cd ..
yarn start
yarn ios
```

  </TabItem>
 </Tabs> 

6. **Add Object Detection to your app**: once you see the default React Native welcome page on your device, change your **App.tsx** code to the following one

``` jsx
import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {
 Delegate,
 MediapipeCamera,
 RunningMode,
 useObjectDetection,
} from 'react-native-mediapipe';
import {useCameraPermission} from 'react-native-vision-camera';


function App(): React.JSX.Element {
 const cameraPermission = useCameraPermission();
 const [categories, setCategories] = React.useState<string>();
 const frameProcessor = useObjectDetection(
   results => {
     setCategories(
       results.results
         .map(result =>
           result.detections
             .map(d => d.categories.map(c => c.categoryName).join(', '))
             .join(', '),
         )
         .join(', '),
     );
   },
   error => {
     console.error(`onError: ${error}`);
   },
   RunningMode.LIVE_STREAM,
   'efficientdet-lite0.tflite',
   {delegate: Delegate.GPU},
 );


 return (
   <SafeAreaView style={styles.root}>
     {cameraPermission.hasPermission ? (
       <View style={styles.container}>
         <MediapipeCamera style={styles.camera} processor={frameProcessor} />
         <Text style={styles.categoriesText}>{categories}</Text>
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
 },
 camera: {
   flex: 1,
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

7. **Reload app**: and grant acces to camera permissions