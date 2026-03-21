# Smaller downloads & storage (low-cost Android phones)

## Already configured in this repo

1. **`expo-build-properties`** – `buildArchs`: **armeabi-v7a** + **arm64-v8a** only (real devices). Drops **x86 / x86_64** (mostly emulators), which **cuts native `.so` size** a lot in universal APKs.
2. **`android/gradle.properties`** – `reactNativeArchitectures` matches the above (keeps local/EAS Gradle in sync; run `npx expo prebuild` after changing plugins if you use CNG).
3. **EAS `production`** – **`app-bundle`** (AAB) for Play Store: Google serves **split APKs** per device so each user downloads **less** than one fat universal APK.

**Preview / internal APK** (`eas.json` → `preview`) stays **`apk`** for easy sideloading; it is now ARM-only and smaller than before.

## Optional next steps (product + engineering)

| Idea | Effect |
|------|--------|
| **Server-side inference only** | Removing or not shipping **ONNX** / heavy on-device ML **shrinks the app** the most. |
| **Smaller assets** | Compress images; avoid huge bundled models in `assets/`. |
| **Play Store** | Prefer **AAB** + internal testing; avoid one giant universal APK for everyone. |
| **R8 / minify** | Can reduce size more but needs **release testing** and ProGuard rules. Enable via `expo-build-properties` when ready. |

## Emulator development

If you need **x86_64** emulator builds, temporarily set:

`reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`

or pass `-PreactNativeArchitectures=x86_64` for a one-off Gradle command.
