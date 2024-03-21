const path = require("path");
const pak = require("../package.json");

module.exports = {
  assets: ["./assets/models"], // Adjust the path according to your assets structure

  dependencies: {
    [pak.name]: {
      root: path.join(__dirname, ".."),
    },
  },
};
