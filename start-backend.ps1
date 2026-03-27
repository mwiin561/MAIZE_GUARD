# Maize Guard Unified Backend Starter
# This script starts both the Node.js API and the Python AI Inference Service

Write-Host "🚀 Starting Maize Guard Backend Ecosystem..." -ForegroundColor Cyan

# 1. Start Python AI Service in a background job
Write-Host "Starting Python AI Service (Port 5003)..." -ForegroundColor Yellow
$PythonJob = Start-Process python -ArgumentList "backend/tflite_service/app.py" -NoNewWindow -PassThru

# 2. Wait a moment for Python to bind to port
Start-Sleep -Seconds 3

# 3. Start Node.js API Service
Write-Host "Starting Node.js API Service (Port 5001)..." -ForegroundColor Green
npm start --prefix backend

# Cleanup: If Node.js is stopped (Ctrl+C), kill the Python process
if ($PythonJob) {
    Write-Host "Stopping Python AI Service..." -ForegroundColor Red
    Stop-Process -Id $PythonJob.Id -Force
}
