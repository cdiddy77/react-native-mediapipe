# Examples

## How to create a new example

```sh
npx npx @react-native-community/cli@latest init examplename
cd examplename
yarn
bundle install
cd ios
pod install
cd ..
yarn add react-native-vision-camera react-native-worklets-core
yarn add -D babel-plugin-module-resolver
cd ios && pod install

```
### modify various build files

per [RNVC getting started - update the min sdk for android](https://react-native-vision-camera.com/docs/guides/#installing-the-library)
- android/build.gradle buildscript.ext.minSdkVersion = 26

per [RNVC getting started - updating manifests](https://react-native-vision-camera.com/docs/guides/#updating-manifests)

- update Info.plist
- update AndroidManifest.xml 

### Modify the source code

- Edit `tsconfig.json` to what it is
- Create `src` directory. Move `App.tsx` to `src`
- Edit `index.js` import App statement
- Edit `App.tsx` to what it is
- Edit `babel.config.js` to what it is
- Edit `metro.config.js` to what it is
- Edit `react-native.config.js` to what it is
- Delete `prettierrc.js`, `eslintrc.js`, `.gitignore`

### Add the model file download stuff

Lift from [This PR](https://github.com/cdiddy77/react-native-mediapipe/pull/85) and from the appropriate example from [the MediaPipe examples](https://github.com/googlesamples/mediapipe/blob/9d0624bb1cf1baa8ac31991748d69ec219aa3535/examples)

### add boilerplate code for tabs/icons/etc

```sh
yarn add @react-native-community/slider @react-native-picker/picker @react-navigation/bottom-tabs @react-navigation/native @shopify/react-native-skia react-native-image-crop-picker react-native-picker-select react-native-safe-area-context react-native-screens react-native-vector-icons
yarn add -D @types/react-native-vector-icons
```

- Follow special installation for react-native-vector-icons. Lift from [This PR](https://github.com/cdiddy77/react-native-mediapipe/pull/60)
- copy various files from a different example `src` directory to the new `src` directory
  - app-settings.ts
  - App.tsx
  - CameraStream.tsx
  - Drawing.tsx
  - navigation.ts
  - Photo.tsx
  - Settings.tsx