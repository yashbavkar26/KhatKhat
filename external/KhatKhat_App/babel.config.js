module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // react-native-reanimated/plugin is usually included in babel-preset-expo
      // but if you get errors, you can try adding it back.
    ],
  };
};
