const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimization: Exclude problematic native modules from being watched on Windows
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/lightningcss-.*/,
  /node_modules\/react-native-css-interop\/node_modules\/.*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
