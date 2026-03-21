# Backend Setup Guide

## Overview
Maize Guard requires **two backend services** running simultaneously:

1. **Node.js Backend (Port 5001)** - Authentication, database, image uploads
2. **Flask TFLite Service (Port 5003)** - PyTorch model inference

## Prerequisites

### 1. Database Configuration
Your backend uses **Neon PostgreSQL** database. Ensure your `.env` file exists:

**Location**: `backend/.env`

**Required Variables**:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
JWT_SECRET=your_jwt_secret_key
PORT=5001
TFLITE_SERVICE_URL=http://localhost:5003
```

### 2. Node.js Dependencies
```powershell
cd backend
npm install
```

### 3. Python Virtual Environment
```powershell
cd backend/tflite_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Starting the Servers

### Option 1: Automated Startup (Recommended)
Run both servers with one command:

```powershell
.\start-backend.ps1
```

This will:
- ✅ Check for `.env` file
- ✅ Start Node.js backend on port 5001
- ✅ Start Flask service on port 5003
- ✅ Show combined logs from both services
- ✅ Stop both when you press Ctrl+C

### Option 2: Manual Startup

**Terminal 1 - Node.js Backend:**
```powershell
cd backend
$env:PORT="5001"
node server.js
```

**Terminal 2 - Flask Service:**
```powershell
cd backend/tflite_service
.\.venv\Scripts\Activate.ps1
python app.py
```

## Verifying the Servers

### Check Node.js Backend
```powershell
curl http://localhost:5001
# Expected: "Maize Guard API is running..."
```

### Check Flask Service
```powershell
curl http://localhost:5003/health
# Expected: {"status":"ok","type":"pytorch_jit","parameters":{...}}
```

### Check Database Connection
Look for this in Node.js logs:
```
✅ Connected to Neon DB successfully!
✅ Connected to Neon DB via Websockets! (Port 443)
```

## How They Work Together

### Image Analysis Flow
1. **App** → Sends image to Flask (`http://192.168.110.211:5003/predict`)
2. **Flask** → Runs PyTorch model, returns diagnosis
3. **App** → Uploads image to Node.js backend (`http://192.168.110.211:5001/api/scans/upload-image`)
4. **Node.js** → Saves to database, stores image URL
5. **App** → Saves scan record with diagnosis

### Authentication Flow
1. **App** → Login request to Node.js (`/api/auth/login`)
2. **Node.js** → Validates credentials against Neon DB
3. **Node.js** → Returns JWT token
4. **App** → Uses token for authenticated requests

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` in `.env`
- Verify Neon database is accessible
- Check firewall/network settings

### "Flask service not reachable"
- Ensure Python virtual environment is activated
- Check `model_torchscript.pt` exists in `backend/tflite_service/`
- Verify port 5003 is not in use

### "Module not found" errors
**Node.js:**
```powershell
cd backend
npm install
```

**Python:**
```powershell
cd backend/tflite_service
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Port Already in Use
**Find and kill process:**
```powershell
# For port 5001
netstat -ano | findstr :5001
taskkill /PID [PID] /F

# For port 5003
netstat -ano | findstr :5003
taskkill /PID [PID] /F
```

## Environment Variables

### Node.js Backend (.env)
```env
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection
JWT_SECRET=your_secret_key             # For JWT token signing
PORT=5001                              # Backend server port
TFLITE_SERVICE_URL=http://localhost:5003  # Flask service URL
```

### Flask Service
Uses `model_info.json` for model configuration:
```json
{
  "class_names": ["Healthy", "MSV", "Unknown"],
  "confidence_threshold": 0.7,
  "preprocessing": {
    "resize": [224, 224],
    "normalize": false,
    "interpolation": "bilinear"
  }
}
```

## Testing the Full Stack

1. **Start both backends** (use `start-backend.ps1`)
2. **Start Expo dev server**:
   ```powershell
   npx expo start
   ```
3. **Scan QR code** with Expo Go on your phone
4. **Take a photo** of a maize leaf
5. **Check logs**:
   - Flask: `🔮 Prediction: [diagnosis] ([confidence])`
   - Node.js: `POST /api/scans/upload-image`

## Production Deployment

For production, both services are deployed to Render:
- Node.js: `https://maizeguard-backend-1.onrender.com`
- Flask: Integrated via `TFLITE_SERVICE_URL` env variable

The app automatically switches between dev (localhost) and production URLs based on `__DEV__` flag.
