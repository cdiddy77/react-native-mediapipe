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

    <uses-permission android:name ="android.permission.INTERNET"/>
    <uses-permission android:name ="android.permission.CAMERA"/>
    ...
```

:::info

**You must change the main Android manifest file** not the debugging one

:::

3. **Terminal Commands:** In your terminal run the following commands

```
yarn add @shopify/react-native-skia react-native-reanimated
```

  </TabItem>

  <TabItem value="iOS" label="iOS">

1. **Give Permissions:** Navigate to your **info.plist** file in the outermost tag:

```jsx
// add this at line 11 right after the </script> tag

  <key>NSCameraUsageDescription</key>
  <string>$(PRODUCT_NAME) needs access to your Camera.</string>
```


2. **Terminal Commands:** In your terminal run the following command

```
yarn add @shopify/react-native-skia react-native-reanimated
```

:::info
You will only need to run the bundle install command once.

:::

```
cd ios
bundle install
pod install
```

  </TabItem>
 </Tabs> 
