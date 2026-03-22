# Google Sign-In (OAuth) – MAIZE_GUARD

## Two different OAuth clients in Google Cloud

| Client type | Used for | What you configure |
|-------------|----------|-------------------|
| **Web application** | Sign-in inside a **browser**, Firebase web, `localhost` | **Authorized redirect URIs** — **only `http://` or `https://`** |
| **Android** | Sign-in from your **installed app** (`expo-auth-session` on Android) | **Package name** + **SHA-1** — **no** redirect URIs (Google ties the app to the cert) |

You **cannot** put `com.maizeguard.app:/oauthredirect` (or `exp://…`) on the **Web** client. Google will show: *must use either http or https as the scheme*.

This app uses the **Android** OAuth client ID on Android (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / “Maize Guard Android”), **not** the Web client ID for the native flow.

---

## Android (development build or release APK — not Expo Go)

1. **Google Cloud** → **Credentials** → **Maize Guard Android** (type: Android).
2. **Package name:** `com.maizeguard.app` (must match `app.json`).
3. **SHA-1 certificate fingerprint:** must match how the APK is signed:
   - **EAS Build:** run `eas credentials -p android`, or take SHA-1 from the Play Console / keystore you use.
   - **Debug local build:** add your debug keystore SHA-1 (`cd android && ./gradlew signingReport` on Mac/Linux, or Android Studio).
4. Save. Wait a minute and try again.

Do **not** add `com.maizeguard.app:/oauthredirect` to the **Web** client — remove that entry if you added it by mistake.

---

## Web client (keep only valid URIs)

Under **Web application** → **Authorized redirect URIs**, keep only URLs Google allows, for example:

- `https://maize-guard-5df1f.firebaseapp.com/__/auth/handler` (Firebase)
- `http://localhost:8081` (local web / Metro, if you use it)

Remove invalid `exp://` or `com.maizeguard.app:…` lines.

---

## Expo Go

**Expo Go** uses an `exp://` redirect that Google does not support for these clients. Use a **development build** (`npx expo run:android` or EAS) for Google Sign-In.

---

## OAuth consent screen

While the app is in **Testing**, add your Google account under **Test users**.

---

## If it still fails

- Confirm **SHA-1** on the **Android** client matches the build you installed.
- Optional: use **`@react-native-google-signin/google-signin`** for fully native Google Sign-In (different setup).
