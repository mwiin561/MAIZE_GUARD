# TFLite inference service (v2 model)

Run the **real v2 TFLite model** as a local HTTP service so you can test it with the app before building the APK. Render cannot run TFLite; this service runs on your machine and the Node backend calls it when `TFLITE_SERVICE_URL` is set.

## 1. Put the v2 model in place

Ensure the real model file exists at:

- `backend/public/models/v2/model.tflite`

If you use a different path, set the `MODEL_PATH` environment variable when starting the service.

## 2. Install and run the service

TensorFlow needs **Python 3.11** and can hit Windows path length limits. Use a **short venv path** to avoid "No such file or directory" during install:

```powershell
# Create venv in a short path (avoids Windows 260-char path limit with TF 2.17+)
py -3.11 -m venv C:\mg\tflite
C:\mg\tflite\Scripts\Activate.ps1
cd C:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\tflite_service
pip install -r requirements.txt
# Run from project folder so MODEL_PATH finds backend/public/models/v2/
python app.py
```

Or use the venv inside the project (may need [long paths enabled](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation) and restart):

```powershell
cd backend\tflite_service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

You should see: `Loaded TFLite model: ...` and `TFLite service listening on http://localhost:5003`.

## 3. Point the Node backend at the service

In `backend/.env` add:

```
TFLITE_SERVICE_URL=http://localhost:5003
```

## 4. Start the Node backend and test the app

From `backend`:

```powershell
npm run dev
```

Use the app (web or device) and run a scan. The backend will send the image to the TFLite service and return the real v2 model result. You can then confirm whether “maize leaf or not” and diagnosis come from the model or from the app logic.

## Endpoints

- `GET /health` — Check if the model is loaded.
- `POST /predict` — Run inference. Body: JSON `{ "imageData": "data:image/jpeg;base64,..." }` (same as the app), or multipart form field `image`, or raw image bytes.

## If the model path is different

```powershell
$env:MODEL_PATH = "C:\path\to\your\model.tflite"
python app.py
```

## Note on input/output

The service assumes input size 224×224, RGB, normalized to [0, 1], and two output classes (Healthy, Maize Streak Virus). If your v2 model uses a different input size or normalization, edit `app.py` (`INPUT_SIZE` and `preprocess_image`).
