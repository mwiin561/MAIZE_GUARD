# Smaller downloads & storage (farmer phones)

## CPU architectures (current)

The app is built for **`arm64-v8a` only** (64-bit ARM).

| Who | Supported |
|-----|-----------|
| **Typical Android phones from the last ~6–8 years** | Yes (64-bit) |
| **Very old 32-bit-only phones** (`armeabi-v7a` only) | **No** — install will fail or store may hide the app |
| **PC emulators** (x86/x86_64) | **No** in this APK — use a Gradle override for dev |

This **roughly halves** the native library footprint versus shipping **both** `armeabi-v7a` and `arm64-v8a` in one APK.

### Need wider device coverage?

Edit **`android/gradle.properties`** and **`app.json`** → `expo-build-properties` → `buildArchs`:

```text
armeabi-v7a,arm64-v8a
```

Then `npx expo prebuild` (if you use CNG) and rebuild.

### Need an emulator build?

```bash
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=x86_64
```

## Other settings

1. **`expo-build-properties`** – keeps `buildArchs` in sync with Gradle.
2. **EAS `production`** – **`app-bundle`** (AAB) on Play Store: Google serves **split APKs** per device (smallest download).
3. **Preview APK** – sideload; still **arm64-only** with this config.

## Optional next steps

| Idea | Effect |
|------|--------|
| **ONNX INT8 quantization** | Smaller model file; validate accuracy on your dataset |
| **AAB on Play** | Smallest install for end users |
| **R8 / minify** | Smaller Java/Kotlin + resources; test release builds |
