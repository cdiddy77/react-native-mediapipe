---
sidebar_position: 1
---

# Installation

To integrate React Native MediaPipe into your project, follow these simple steps.

### Requirements 
- Gradle minimum SDK 24 or higher
- Android-SDK Version 26 or higher
- iOS 12 or higher

1. **Open Terminal or Command Prompt:** Open your terminal or command prompt application.
2. **Navigate to Your Project Directory:** Navigate to your React Native project directory.
3. **Install React Native MediaPipe:** Run the following command to install React Native MediaPipe and its dependencies:

#### Using npm
```bash
npm install react-native-mediapipe react-native-vision-camera react-native-worklets-core
```

#### Using yarn

```bash
yarn install react-native-mediapipe react-native-vision-camera react-native-worklets-core
```
4. **Configuring Babel:** Navigate to the 'babel.config.js' file and add:

```bash
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [['react-native-worklets-core/plugin']],
};
```
5. **Configuring Gradle:** Navigate to the 'gradle/build.gradle' file and change minSdkVersion to 24

:::warning

**Gradle minimum SDK** must be 24 or higher to run

:::

```bash
buildscript {
    ext {
        ...
        minSdkVersion = 24 
        ...
    }
    ...
}

```

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

### Configuring to your Operating System

<Tabs groupId="operating-systems">
  <TabItem value="win" label="Windows">
    <p>
      1. **Give Permissions:** Navigate to your AndroidManifest.xml file and add:
    </p>
    ```
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- optionally, if you want to record audio: -->
    
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    ```
  </TabItem>
  <TabItem value="mac" label="macOS">
  <p>
    1. **Give Permissions:** Navigate to your info.plist file in the outermost tag:
  </p>
    ```
    <key>NSCameraUsageDescription</key>
    <string>$(PRODUCT_NAME) needs access to your Camera.</string>

    <!-- optionally, if you want to record audio: -->

    <key>NSMicrophoneUsageDescription</key>
    <string>$(PRODUCT_NAME) needs access to your Microphone.</string>
    ```
  <p>
    2. **Terminal Commands:** In your terminal run the following commands
  </p>
  <pre>
    <code>
      cd ios
      bundle install
      pod install
    </code>
  </pre>
  :::info

  You will only need to run the **bundle install** command once.

  :::
</TabItem>
</Tabs>

