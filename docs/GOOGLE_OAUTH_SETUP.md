# Google Sign-In (OAuth) – Fix "Access blocked: Authorization Error"

If you see **"Access blocked: Authorization Error"** or **Error 400: invalid_request** when signing in with Google in MAIZE_GUARD, use the steps below in [Google Cloud Console](https://console.cloud.google.com/).

---

## Important: Web vs native clients

- **Client ID for Web application** – Only accepts **HTTPS** redirect URIs with a real domain (e.g. `https://yourdomain.com/redirect`). It does **not** accept `exp://` or `maizeguard://`.
- **Client ID for Android / iOS** – Used when signing in from the **phone (Expo Go or dev build)**. The app uses `iosClientId` and `androidClientId` for that; redirect URIs for native may use a custom scheme.

So: **do not** add `exp://192.168.110.211:8081` (or any `exp://` / `maizeguard://` URL) to the **Web** client. Remove it if you added it there.

---

## 1. Web client (only for browser sign-in)

1. Go to **APIs & Services** → **Credentials** and open your **Client ID for Web application**.
2. Under **Authorized redirect URIs**:
   - **Remove** any `exp://` or `maizeguard://` URI (they are invalid for Web and cause the "must end with a public top-level domain" error).
   - Add only **HTTPS** URLs, for example:
     - If you use Google Sign-In on **web**: `http://localhost:8082` (if Google allows it for localhost) or `https://your-production-domain.com`.
3. Save.

---

## 2. Native (Expo Go on phone) – Android and iOS clients

For sign-in from the **phone** you need **Android** and (if you ship iOS) **iOS** OAuth 2.0 clients in the **same** project (MAIZE-GUARD). If you already created one (e.g. **Maize Guard Android**), reuse that client ID — do **not** use the **Web** client ID for `androidClientId`.

### Create Android client

1. On **Credentials**, click **+ CREATE CREDENTIALS** → **OAuth client ID**.
2. **Application type:** **Android**.
3. **Name:** e.g. `MAIZE GUARD Android`.
4. **Package name:** `com.maizeguard.app` (must match `app.json` → `expo.android.package`).
5. **SHA-1 certificate fingerprint (optional for first test):**  
   For Expo Go you can leave blank or add your debug SHA-1. For a production build you’ll add the signing key SHA-1 later.
6. Click **Create**. Copy the **Client ID** (e.g. `xxxxx.apps.googleusercontent.com`).

### Create iOS client

1. Again **+ CREATE CREDENTIALS** → **OAuth client ID**.
2. **Application type:** **iOS**.
3. **Name:** e.g. `MAIZE GUARD iOS`.
4. **Bundle ID:** `com.maizeguard.app` (must match `app.json` → `expo.ios.bundleIdentifier`).
5. Click **Create**. Copy the **Client ID**.

### Use the IDs in the app

1. In the project **root** `.env` file (create it if missing), set:
   - **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`** = full **Android** OAuth client ID from Google Cloud (e.g. **Maize Guard Android**), ending in `.apps.googleusercontent.com`.
   - **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`** = full **iOS** client ID (only if you use Google Sign-In on iPhone).
2. Restart Expo after changing `.env` (`npx expo start -c`).
3. `src/context/AuthContext.js` reads these env vars; **`webClientId`** stays as your **Web application** client (for web / token exchange as configured).

Then **OAuth consent screen** → if the app is in **Testing**, add your Gmail under **Test users**.

---

## 3. OAuth consent screen – test users

1. Go to **APIs & Services** → **OAuth consent screen**.
2. If **Publishing status** is **Testing**, add your Google account under **Test users**.
3. Save.

---

## 4. If it still fails

- Confirm the **Android** OAuth client exists and **`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`** matches it (not the Web client).
- Wait a few minutes after saving in Google Cloud, then try again.
- For "Access blocked", also ensure your email is in **Test users** while the app is in Testing.
