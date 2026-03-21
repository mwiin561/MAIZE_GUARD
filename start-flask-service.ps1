# Start Flask PyTorch Model Service (Port 5003)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Flask AI Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\tflite_service"

# Check if virtual environment exists
if (-not (Test-Path ".venv")) {
    Write-Host "ERROR: Python virtual environment not found" -ForegroundColor Red
    Write-Host "Please create it with: python -m venv .venv" -ForegroundColor Yellow
    Write-Host "Then install dependencies: pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Check if model file exists
if (-not (Test-Path "model_torchscript.pt")) {
    Write-Host "ERROR: Model file 'model_torchscript.pt' not found" -ForegroundColor Red
    Write-Host "Please ensure the PyTorch model is in this directory" -ForegroundColor Yellow
    exit 1
}

# Check and kill process on port 5003 if exists
$port5003 = netstat -ano | findstr :5003 | Select-String "LISTENING"
if ($port5003) {
    $pid = ($port5003 -split '\s+')[-1]
    Write-Host "Killing existing process on port 5003 (PID: $pid)" -ForegroundColor Yellow
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 1
}

Write-Host "Activating Python virtual environment..." -ForegroundColor Yellow
Write-Host "Starting Flask service on port 5003..." -ForegroundColor Yellow
Write-Host "Handles: PyTorch Model Inference" -ForegroundColor Green
Write-Host ""

.\.venv\Scripts\python.exe app.py
