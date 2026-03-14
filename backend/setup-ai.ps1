Write-Host "--- 🌽 Maize Guard AI Service Setup (PyTorch) ---" -ForegroundColor Cyan

# 1. Enter Directory
$serviceDir = "tflite_service"
if (-Not (Test-Path $serviceDir)) {
    Write-Host "❌ Error: $serviceDir folder not found." -ForegroundColor Red
    exit
}
cd $serviceDir

# 2. Check for Python
try {
    python --version
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10+ from python.org" -ForegroundColor Red
    exit
}

# 3. Create Virtual Environment
if (-Not (Test-Path ".venv")) {
    Write-Host "📦 Creating Python virtual environment..."
    python -m venv .venv
}

# 4. Install Requirements
Write-Host "📥 Installing PyTorch and dependencies (this may take a minute)..."
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt

# 5. Final Instructions
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "-------------------------------------------"
Write-Host "👉 1. Place your 'model.pt' file in the 'backend/tflite_service/' folder."
Write-Host "👉 2. Start the AI service with: " -NoNewline
Write-Host ".\.venv\Scripts\python.exe app.py" -ForegroundColor Yellow
Write-Host "-------------------------------------------"
