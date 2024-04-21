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
  plugins: [['react-native-workless-core/plugin']],
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
    <pre>
      <code>
        &lt;uses-permission android:name="android.permission.CAMERA" /&gt;
        
        &lt;!-- optionally, if you want to record audio: --&gt;

        &lt;uses-permission android:name="android.permission.RECORD_AUDIO" /&gt;
      </code>
    </pre>
  </TabItem>
  <TabItem value="mac" label="macOS">
  <p>
    1. **Give Permissions:** Navigate to your info.plist file in the outermost tag:
  </p>
  <pre>
    <code>
      &lt;key&gt;NSCameraUsageDescription&lt;/key&gt;
      &lt;string&gt;$(PRODUCT_NAME) needs access to your Camera.&lt;/string&gt;

      &lt;!-- optionally, if you want to record audio: --&gt;

      &lt;key&gt;NSMicrophoneUsageDescription&lt;/key&gt;
      &lt;string&gt;$(PRODUCT_NAME) needs access to your Microphone.&lt;/string&gt;
    </code>
  </pre>
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



<!-- ---
sidebar_position: 1
---

# Introduction

Let's discover **Docusaurus in less than 5 minutes**.

## Getting Started

Get started by **creating a new site**.

Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.

## Generate a new site

Generate a new Docusaurus site using the **classic template**.

The classic template will automatically be added to your project after you run the command:

```bash
npm init docusaurus@latest my-website classic
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also installs all necessary dependencies you need to run Docusaurus.

## Start your site

Run the development server:

```bash
cd my-website
npm run start
```

The `cd` command changes the directory you're working with. In order to work with your newly created Docusaurus site, you'll need to navigate the terminal there.

The `npm run start` command builds your website locally and serves it through a development server, ready for you to view at http://localhost:3000/.

Open `docs/intro.md` (this page) and edit some lines: the site **reloads automatically** and displays your changes. -->
