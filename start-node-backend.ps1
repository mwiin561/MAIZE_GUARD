# Start Node.js Backend (Port 5001)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Node.js Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend"

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with DATABASE_URL and other credentials" -ForegroundColor Yellow
    exit 1
}

# Check and kill process on port 5001 if exists
$port5001 = netstat -ano | findstr :5001 | Select-String "LISTENING"
if ($port5001) {
    $pid = ($port5001 -split '\s+')[-1]
    Write-Host "Killing existing process on port 5001 (PID: $pid)" -ForegroundColor Yellow
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 1
}

Write-Host "Starting Node.js backend on port 5001..." -ForegroundColor Yellow
Write-Host "Handles: Authentication, Database, Image Uploads" -ForegroundColor Green
Write-Host ""

$env:PORT = "5001"
node server.js
