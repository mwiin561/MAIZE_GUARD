// Expo config plugin to integrate onnxruntime-react-native into the managed Android build
const { withMainApplication, withAppBuildGradle } = require('@expo/config-plugins');

// Pin to the same major.minor as onnxruntime-react-native (npm). Avoid `latest.release` — it often breaks EAS/Gradle.
const ONNXRUNTIME_ANDROID_VERSION = '1.24.3';

const withOnnxRuntime = (config) => {
  // 1. Add OnnxruntimePackage to MainApplication.kt (Expo 54+ template uses PackageList, not Flipper)
  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (contents.includes('OnnxruntimePackage')) {
      mod.modResults.contents = contents;
      return mod;
    }

    const importLine = 'import ai.onnxruntime.reactnative.OnnxruntimePackage\n';
    if (contents.includes('import expo.modules.ReactNativeHostWrapper')) {
      contents = contents.replace(
        /import expo\.modules\.ReactNativeHostWrapper/,
        `import expo.modules.ReactNativeHostWrapper\n${importLine.trim()}`
      );
    } else if (contents.includes('import expo.modules.ApplicationLifecycleDispatcher')) {
      contents = contents.replace(
        /import expo\.modules\.ApplicationLifecycleDispatcher/,
        `import expo.modules.ApplicationLifecycleDispatcher\n${importLine.trim()}`
      );
    }

    // Expo 54 DefaultReactNativeHost: PackageList(this).packages.apply { ... }
    if (contents.includes('PackageList(this).packages.apply') && !contents.includes('OnnxruntimePackage')) {
      contents = contents.replace(
        /(\s*)PackageList\(this\)\.packages\.apply \{[\s\S]*?\n(\s*)\}/m,
        (_, indentLine, indentClose) =>
          `${indentLine}PackageList(this).packages.apply {
${indentClose}  add(OnnxruntimePackage())
${indentClose}}`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  // 2. Native Maven dependency for ONNX Runtime Android
  config = withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;
    const pinned = `com.microsoft.onnxruntime:onnxruntime-android:${ONNXRUNTIME_ANDROID_VERSION}`;
    if (contents.includes('com.microsoft.onnxruntime:onnxruntime-android')) {
      contents = contents.replace(
        /com\.microsoft\.onnxruntime:onnxruntime-android:[^'\n]+/g,
        pinned
      );
    } else {
      contents = contents.replace(
        /dependencies \{/,
        `dependencies {\n    implementation '${pinned}'`
      );
    }
    mod.modResults.contents = contents;
    return mod;
  });

  return config;
};

module.exports = withOnnxRuntime;
