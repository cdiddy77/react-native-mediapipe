# Examples

## How to create a new example

```sh
npx react-native@latest init examplename
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

### Add the model files
Which file gets added will vary from example to example

- add `<example-directory>/android/app/src/main/assets/efficientdet-lite0.tflite`
- add `<example-directory>/ios/objectdetection/efficientdet-lite0.tflite`


