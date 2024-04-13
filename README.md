# react-native-mediapipe

A React Native Camera and Player for MediaPipe applications.

* [Documentation](https://cdiddy77.github.io/react-native-mediapipe/)

## Requirements
* Gradle minimum SDK 24 or higher
* Android-SDK Version 26 or higher
* iOS 12 or higher

## Features
* 🎥 Video streaming from a react-native app to a media pipe
* 🔍 AI Object Detection
* 🧩 Works as a react-native component

## Getting Started

Install react-native-mediapipe from npm:
```sh
npm install react-native-mediapipe react-native-vision-camera react-native-worklets-core
```

Install react-native-mediapipe from yarn:
```sh
yarn add  react-native-mediapipe react-native-vision-camera react-native-worklets-core
```

```js
import { MediaPipeCamera } from "react-native-mediapipe";
```

In your babel.config.js file
```
module.exports = {
presets: ['module:@react-native/babel-present'],
plugins: [['react-native-workles-core/plugin']],
}
```

In your gradle/build.gradle file
```
buildscript {
ext {
...
minSdkVersion = 24 (Make sure that this is at least 24)
...
  }
...
}
```
# If you're on IOS:
In your info.plist file in the outermost <dict> tag:
```
<key>NSCameraUsageDescription</key>
<string>$(PRODUCT_NAME) needs access to your Camera.</string>

<!-- optionally, if you want to record audio: -->
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) needs access to your Microphone.</string>
```
then in your terminal:
```
cd ios
bundle install (you only need to do this once)
pod install
```


# If you're on Android:
In your AndroidManifest.xml file inside the <manifest> tag:
```
<uses-permission android:name="android.permission.CAMERA" />

<!-- optionally, if you want to record audio: -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```



> Link to an example of this in use later.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

Join the [Community](https://discord.gg/ApuAzVnAaX) here! 

## License

MIT

See the [License file](LICENSE) for more information.

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
