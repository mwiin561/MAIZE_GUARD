# MaizeGuard

Offline-first **React Native (Expo)** app for **maize leaf health screening**, with emphasis on **Maize Streak Virus (MSV)** vs **healthy** tissue and handling **uncertain / non-maize** images. The stack includes **on-device ONNX inference**, a **Node.js** API on **PostgreSQL (Neon)**, and optional **cloud AI** services for development or server-side prediction.

---

## Features

- **Camera / gallery** capture, location when available, farmer-friendly diagnosis copy
- **On-device ML** (ONNX Runtime + TensorFlow.js preprocessing) for APK / dev builds  
- **Local history** via AsyncStorage; **batch sync** to the backend when online
- **JWT authentication** (email / password)
- **Structured telemetry**: image metadata, app usage signals, device info, optional logits/scores for research
- **PostgreSQL** schema with `scans` as the canonical event store plus **predictions**, **diagnoses**, and **sync_log** (see `backend/migrations/`)

---

## Tech stack

| Area | Stack |
|------|--------|
| App | Expo SDK 54, React Native, React Navigation (stack + drawer) |
| On-device ML | `onnxruntime-react-native`, TensorFlow.js + `tfjs-react-native` |
| Web (optional) | TF.js model loaded from backend static assets (`ModelService.web.js`) |
| API | Node.js, Express, `multer`, `bcryptjs`, `jsonwebtoken` |
| Database | PostgreSQL on **Neon** (`@neondatabase/serverless` + `ws`) |
| Optional AI worker | Python / TFLite or PyTorch service (e.g. port `5003` in dev), proxied by Express |

---

## Repository layout

```
MAIZE_GUARD/
├── App.js                 # Navigation, AuthProvider, splash
├── app.json               # Expo config (scheme: maizeguard, bundle IDs)
├── src/
│   ├── api/client.js      # API base URL, auth, scans, upload, sync
│   ├── context/           # AuthContext
│   ├── screens/           # Home, Diagnosis, Login, History, etc.
│   └── services/          # ModelService (native / web), RemoteLogger
├── assets/                # Icons, ONNX model bundle (e.g. model.onnx.mp4)
├── backend/
│   ├── server.js          # Express entry (port 5001)
│   ├── routes/            # auth, scans, admin
│   ├── config/db.js       # Neon pool
│   ├── schema.sql         # Base users + scans DDL
│   └── migrations/        # Extra tables, Neon seed scripts
└── README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** or **yarn**
- **Expo CLI** / `npx expo` (see Expo docs for SDK 54)
- For **on-device ONNX**: a **development build** (`expo-dev-client` / EAS build or `expo run:android` / `expo run:ios`). Expo Go often cannot load native ML libraries.
- **PostgreSQL** (e.g. Neon) and connection string for the backend
- Optional: **Python inference service** if you use server-side `/predict` or Flask fallback in dev

---

## Frontend (Expo app)

From the repo root:

```bash
npm install
npx expo start
```

Scripts (`package.json`):

- `npm run start` — Expo dev server  
- `npm run android` / `npm run ios` / `npm run web` — run on targets  

### Configuration

- **Production API** is set in `src/api/client.js` (`PRODUCTION_URL` points at the deployed backend).
- **Local dev on a physical device**: set your PC’s LAN IP so the phone can reach the API, e.g.:

  ```bash
  set EXPO_PUBLIC_BACKEND_HOST=192.168.x.x
  ```

  (Windows PowerShell: `$env:EXPO_PUBLIC_BACKEND_HOST="192.168.x.x"`)

Default dev host in code is a placeholder; **replace it** for your network.

---

## Backend API

From `backend/`:

```bash
cd backend
npm install
npm run dev
```

Server listens on **port `5001`** and binds `0.0.0.0` (see `server.js`).

### Environment variables

Create a `.env` file in `backend/` (or configure in your host, e.g. Render):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (required) |
| `JWT_SECRET` | Secret for signing JWTs (use a strong value in production) |
| `TFLITE_SERVICE_URL` | Optional URL for the Python `/predict` service (defaults to `http://localhost:5003` in code paths that use it) |

### Database

1. Apply base schema: `backend/schema.sql` (or your migration runner).
2. For **predictions / diagnoses / sync_log**, use the SQL under `backend/migrations/` (e.g. `neon_replace_predictions_diagnoses_sync_log.sql` or incremental scripts).  
   Read each file’s header for **warnings** (some scripts drop and recreate tables).

### Main API surface

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` (see `routes/auth.js`)
- **Scans:** `POST /api/scans`, `POST /api/scans/sync`, `GET /api/scans` (auth via header `x-auth-token`)
- **Uploads:** `POST /api/scans/upload-image`, `POST /api/scans/upload-image-web`
- **Debug:** `POST /api/debug/log` (mobile remote logging)
- **Predict proxy:** `POST /predict` (multipart / `imageData` → Python service)

---

## AI / inference (short)

- **Mobile (native):** ONNX model in `assets/`; `ModelService.native.js` runs **224×224** preprocessing, **3-class logits** [Healthy, MSV, Unknown], softmax for scores.
- **Dev:** optional HTTP call to **`MODEL_SERVICE_URL/predict`** (Flask-style) when ONNX is unavailable (`__DEV__`).
- **Web:** `ModelService.web.js` may load a TF.js model from the backend static path or fall back to a mock.

---

## Deployment notes

- **API:** e.g. **Render** (or similar) with `DATABASE_URL` and `JWT_SECRET` set.
- **DB:** **Neon** — run migrations against the production branch.
- **App:** EAS Build or local release builds for Android/iOS; **production** builds use the production API URL in `client.js`.

---

## License

Specify your license here (repository default not set).

---

## Contributing / support

Use `backend` logs and `POST /api/debug/log` output from the app for troubleshooting. For ONNX on device, confirm a **development build** is installed and native modules are linked.
