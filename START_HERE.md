# Maize Guard - Development Startup Guide

## Quick Start: 3-Terminal Setup

To run the complete Maize Guard application, you need **3 separate terminals** running simultaneously:

### Terminal 1: Node.js Backend (Port 5001)
```powershell
.\start-node-backend.ps1
```
**Handles:**
- User authentication & JWT tokens
- PostgreSQL database (Neon)
- Image uploads & storage
- Scan history management

**Check it's running:**
```powershell
curl http://localhost:5001
# Expected: "Maize Guard API is running..."
```

---

### Terminal 2: Flask AI Service (Port 5003)
```powershell
.\start-flask-service.ps1
```
**Handles:**
- PyTorch model inference
- Image preprocessing
- Disease diagnosis (Healthy/MSV/Unknown)

**Check it's running:**
```powershell
curl http://localhost:5003/health
# Expected: {"status":"ok","type":"pytorch_jit",...}
```

---

### Terminal 3: Expo Frontend
```powershell
.\start-frontend.ps1
```
**Handles:**
- React Native app
- QR code for mobile testing
- Web interface (optional)

**Test on phone:**
1. Install Expo Go app on your phone
2. Scan the QR code from the terminal
3. App will connect to your backend services

---

## Complete Workflow

### 1. Open 3 PowerShell Terminals

**Terminal 1:**
```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
.\start-node-backend.ps1
```

**Terminal 2:**
```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
.\start-flask-service.ps1
```

**Terminal 3:**
```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
.\start-frontend.ps1
```

### 2. Verify All Services

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Node.js Backend | http://localhost:5001 | "Maize Guard API is running..." |
| Flask AI Service | http://localhost:5003/health | `{"status":"ok"}` |
| Expo Frontend | http://localhost:8081 | Metro bundler interface |

### 3. Test on Your Phone

1. **Ensure phone and PC are on same WiFi**
2. **Open Expo Go app** on your phone
3. **Scan QR code** from Terminal 3
4. **Take a photo** of a maize leaf
5. **Watch the logs**:
   - Terminal 1: Image upload logs
   - Terminal 2: Model prediction logs
   - Terminal 3: App navigation logs

---

## How They Work Together

```
┌─────────────────┐
│   Your Phone    │
│   (Expo Go)     │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌────────────────────┐          ┌──────────────────────┐
│  Flask AI Service  │          │   Node.js Backend    │
│    (Port 5003)     │          │     (Port 5001)      │
│                    │          │                      │
│ • PyTorch Model    │          │ • Authentication     │
│ • Image Analysis   │          │ • Database (Neon)    │
│ • Diagnosis        │          │ • Image Storage      │
└────────────────────┘          └──────────────────────┘
```

### Image Analysis Flow:
1. **User takes photo** in app
2. **App → Flask (5003)**: Send image for analysis
3. **Flask**: Run PyTorch model, return diagnosis
4. **App → Node.js (5001)**: Upload image & save scan
5. **Node.js**: Store in database, return confirmation
6. **App**: Display results to user

---

## Prerequisites

### Node.js Backend
- `.env` file with `DATABASE_URL`, `JWT_SECRET`
- Node.js dependencies: `cd backend && npm install`

### Flask Service
- Python virtual environment: `cd backend/tflite_service && python -m venv .venv`
- Dependencies: `.\.venv\Scripts\Activate.ps1 && pip install -r requirements.txt`
- Model file: `model_torchscript.pt` must exist

### Frontend
- Expo CLI: `npm install -g expo-cli` (optional, npx works)
- Expo Go app installed on your phone

---

## Troubleshooting

### "Port already in use"
The startup scripts automatically kill existing processes on ports 5001 and 5003.

### "Database connection failed"
Check your `.env` file in the `backend` folder has valid `DATABASE_URL`.

### "Model file not found"
Ensure `model_torchscript.pt` exists in `backend/tflite_service/`.

### "Cannot connect from phone"
1. Check PC and phone are on same WiFi
2. Verify PC's IP address matches `DEV_BACKEND_HOST` in `src/api/client.js`
3. Check Windows Firewall allows ports 5001, 5003, 8081

### "Flask encoding errors"
Fixed - emojis removed from Python script for Windows compatibility.

---

## Stopping the Services

Press **Ctrl+C** in each terminal to stop the respective service.

Or close all terminal windows.

---

## Production vs Development

### Development (Current Setup)
- Frontend: `http://localhost:8081` (Metro bundler)
- Backend: `http://192.168.110.211:5001` (from phone)
- AI Service: `http://192.168.110.211:5003` (from phone)

### Production
- Frontend: Expo build (APK/IPA)
- Backend: `https://maizeguard-backend-1.onrender.com`
- AI Service: Integrated with backend on Render

The app automatically switches based on `__DEV__` flag.

---

## Next Steps

1. ✅ Start all 3 services
2. ✅ Scan QR code with Expo Go
3. ✅ Test image analysis
4. ✅ Verify predictions in Flask logs
5. ✅ Check database saves in Node.js logs

Happy coding! 🌽
