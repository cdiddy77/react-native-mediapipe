const path = require("path");
const pak = require("../../package.json");

module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    ["react-native-worklets-core/plugin"],
    [
      "module-resolver",
      {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          [pak.name]: path.join(__dirname, "../..", pak.source),
        },
      },
    ],
  ],
};
