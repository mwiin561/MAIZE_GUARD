// Expo config plugin to integrate onnxruntime-react-native into the managed Android build
const { withMainApplication, withAppBuildGradle } = require('@expo/config-plugins');

const withOnnxRuntime = (config) => {
  // 1. Add OnnxruntimePackage to MainApplication.kt
  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;

    // Add import if not already there
    if (!contents.includes('OnnxruntimePackage')) {
      contents = contents.replace(
        /import expo\.modules\.ReactActivityDelegateWrapper/,
        `import ai.onnxruntime.reactnative.OnnxruntimePackage\nimport expo.modules.ReactActivityDelegateWrapper`
      );

      // Add to package list
      contents = contents.replace(
        /packages\.add\(ReactNativeFlipper/,
        `packages.add(OnnxruntimePackage())\n      packages.add(ReactNativeFlipper`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  // 2. Add the Maven repo for ONNX Runtime
  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('com.microsoft.onnxruntime')) {
      contents = contents.replace(
        /dependencies \{/,
        `dependencies {\n    implementation 'com.microsoft.onnxruntime:onnxruntime-android:latest.release'`
      );
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return config;
};

module.exports = withOnnxRuntime;
