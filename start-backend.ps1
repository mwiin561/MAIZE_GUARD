# Start Both Backend Servers for Maize Guard
# Node.js Backend (port 5001) + Flask TFLite Service (port 5003)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Maize Guard Backend Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
$envPath = "c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found at $envPath" -ForegroundColor Red
    Write-Host "Please create .env file with DATABASE_URL and other credentials" -ForegroundColor Yellow
    exit 1
}

# Check and kill processes using ports 5001 and 5003
Write-Host "Checking for port conflicts..." -ForegroundColor Yellow
$port5001 = netstat -ano | findstr :5001 | Select-String "LISTENING"
if ($port5001) {
    $pid = ($port5001 -split '\s+')[-1]
    Write-Host "  Killing process on port 5001 (PID: $pid)" -ForegroundColor Yellow
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 1
}

$port5003 = netstat -ano | findstr :5003 | Select-String "LISTENING"
if ($port5003) {
    $pid = ($port5003 -split '\s+')[-1]
    Write-Host "  Killing process on port 5003 (PID: $pid)" -ForegroundColor Yellow
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 1
}
Write-Host "  Ports cleared" -ForegroundColor Green
Write-Host ""

# Start Node.js Backend (Port 5001)
Write-Host "[1/2] Starting Node.js Backend (Port 5001)..." -ForegroundColor Yellow
$nodeJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend"
    $env:PORT = "5001"
    node server.js
}
Start-Sleep -Seconds 2
Write-Host "  Node.js Backend started (Job ID: $($nodeJob.Id))" -ForegroundColor Green

# Start Flask TFLite Service (Port 5003)
Write-Host "[2/2] Starting Flask TFLite Service (Port 5003)..." -ForegroundColor Yellow
$flaskJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\tflite_service"
    & .\.venv\Scripts\python.exe app.py
}
Start-Sleep -Seconds 3
Write-Host "  Flask TFLite Service started (Job ID: $($flaskJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Both Servers Running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  Node.js Backend:     http://localhost:5001" -ForegroundColor Cyan
Write-Host "  Flask AI Service:    http://localhost:5003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs:" -ForegroundColor White
Write-Host "  Node.js:  Receive-Job -Id $($nodeJob.Id) -Keep" -ForegroundColor Gray
Write-Host "  Flask:    Receive-Job -Id $($flaskJob.Id) -Keep" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to view logs, or close this window to stop servers" -ForegroundColor Yellow
Write-Host ""

# Monitor both jobs and show combined output
try {
    while ($true) {
        $nodeOutput = Receive-Job -Id $nodeJob.Id
        $flaskOutput = Receive-Job -Id $flaskJob.Id
        
        if ($nodeOutput) {
            Write-Host "[NODE] " -ForegroundColor Blue -NoNewline
            Write-Host $nodeOutput
        }
        if ($flaskOutput) {
            Write-Host "[FLASK] " -ForegroundColor Magenta -NoNewline
            Write-Host $flaskOutput
        }
        
        # Check if jobs are still running
        if ($nodeJob.State -ne 'Running') {
            Write-Host "Node.js Backend stopped unexpectedly!" -ForegroundColor Red
            break
        }
        if ($flaskJob.State -ne 'Running') {
            Write-Host "Flask Service stopped unexpectedly!" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Id $nodeJob.Id, $flaskJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $nodeJob.Id, $flaskJob.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}
