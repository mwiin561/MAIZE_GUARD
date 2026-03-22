# Flask Backend Integration Guide

## Overview
Your app now uses the local Flask backend (PyTorch model) on port 5003 for image analysis instead of the cloud service.

## How It Works

### Prediction Flow
1. **Primary**: Flask Backend (port 5003) - Your PyTorch model
2. **Fallback 1**: Offline ONNX model (on-device)
3. **Fallback 2**: Mock predictions

### Backend API
- **Endpoint**: `http://localhost:5003/predict` (web) or `http://192.168.110.211:5003/predict` (mobile)
- **Method**: POST
- **Input**: FormData with image file
- **Output**: JSON with diagnosis, confidence, and classification

## Starting the Flask Backend

### 1. Navigate to Backend Directory
```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\tflite_service
```

### 2. Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Start the Flask Server
```powershell
python app.py
```

The server will start on `http://0.0.0.0:5003`

## Testing the Integration

### Option 1: Using Expo Go (Recommended)
1. Start the Flask backend (see above)
2. Start Expo dev server:
   ```powershell
   cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
   npx expo start
   ```
3. Scan the QR code with Expo Go app on your phone
4. Take a photo of a maize leaf
5. The app will send the image to your Flask backend for analysis

### Option 2: Web Testing
1. Start the Flask backend
2. Start Expo in web mode:
   ```powershell
   npx expo start --web
   ```
3. Upload a maize leaf image
4. Check browser console for "🔮 Flask Backend Result" logs

## Troubleshooting

### Backend Not Reachable from Phone
- Ensure your phone and PC are on the same WiFi network
- Check that `DEV_BACKEND_HOST` in `src/api/client.js` matches your PC's IP
- Verify Flask is running: `http://localhost:5003/health`

### Model Predictions Incorrect
- Check Flask console for prediction logs
- Verify `model_torchscript.pt` exists in backend directory
- Review `model_info.json` for correct configuration

### Fallback to Mock
If you see mock predictions, check:
1. Flask backend is running
2. Network connectivity between phone and PC
3. Firewall isn't blocking port 5003

## Configuration Files

### Backend Config
- `backend/tflite_service/model_info.json` - Model parameters
- `backend/tflite_service/app.py` - Flask server

### App Config
- `src/api/client.js` - Backend URLs (line 17-19)
- `src/services/ModelService.native.js` (Android/iOS) / `ModelService.web.js` (web) — prediction logic

## Expected Response Format

```json
{
  "diagnosis": "Healthy" | "MSV" | "Not a Maize Leaf" | "Uncertain Scan",
  "raw_class": "Healthy" | "MSV" | "Unknown",
  "confidence": 0.95,
  "isHealthy": true,
  "isInfected": false,
  "isMaize": true,
  "class_index": 0,
  "scores": [0.95, 0.03, 0.02]
}
```

## Next Steps

1. Start Flask backend
2. Test with Expo Go by scanning QR code
3. Verify predictions in Flask console logs
4. Check app displays correct diagnosis
