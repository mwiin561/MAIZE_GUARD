# EAS Android: “No variants exist” / `AgpVersionAttr` / `releaseRuntimeClasspath`

## What the error means

Gradle is trying to resolve autolinked libraries (e.g. `react-native-async-storage`) as **project** dependencies for **release**, but those projects report **no consumable variants**. This often happens on **EAS** when the build uses a **fresh `expo prebuild`** on the server (SDK 54 + Gradle 8.14 + AGP 8.11), while **`npx expo run:android` works locally** because your machine already has a coherent `android/` tree.

## Fix that usually works: commit `android/`

Your repo used to ignore the whole `/android` folder. Then EAS **never** uploads your local native project and always **regenerates** it in the cloud — which can hit this variant-resolution failure.

1. **Stop ignoring the whole `android` directory** (this repo’s `.gitignore` now only ignores build outputs under `android/`, not the project itself).
2. On your PC, from the project root:
   ```bash
   npx expo prebuild --clean
   ```
3. Confirm a release build locally (optional but strong check):
   ```bash
   cd android
   .\gradlew.bat assembleRelease
   cd ..
   ```
4. **Commit and push** the `android/` folder (except ignored paths like `android/app/build/`).
5. Run EAS again:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

EAS will then use the **same** `android/` project as your machine instead of only a server-side prebuild.

## After you change native config

Whenever you change `app.json` / plugins that affect native code, run `npx expo prebuild --clean` again and commit the updated `android/` (and `ios/` if you track it).

## Other things to try

- `eas build ... --clear-cache` alone (if the failure was a bad remote cache).
- If Expo publishes a fix for SDK 54 + Gradle, upgrade `expo` / `react-native` with `npx expo install expo@latest`.

## References

- Similar reports: Expo GitHub issue “\[SDK 54\] EAS Build fails with No matching variant (AGP 8.11.0)”.
- Community: EAS succeeds after committing `android/` when local `expo run:android` already works.
