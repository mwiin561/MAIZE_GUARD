Write-Host "--- Maize Guard AI Service Setup (PyTorch) ---"

# 1. Enter Directory
$serviceDir = "tflite_service"
if (-Not (Test-Path $serviceDir)) {
    Write-Host "Error: $serviceDir folder not found."
    exit
}
cd $serviceDir

# 2. Check for Python
try {
    python --version
} catch {
    Write-Host "Error: Python not found. Please install Python 3.10+ from python.org"
    exit
}

# 3. Create Virtual Environment
if (-Not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
}

# 4. Install Requirements
Write-Host "Installing PyTorch and dependencies (this may take a minute)..."
$pythonPath = ".\.venv\Scripts\python.exe"
& $pythonPath -m pip install --upgrade pip
& $pythonPath -m pip install -r requirements.txt

# 5. Final Instructions
Write-Host ""
Write-Host "Setup Complete!"
Write-Host "-------------------------------------------"
Write-Host "1. Place your 'model.pt' file in 'backend/tflite_service/' folder."
Write-Host "2. Start the AI service with: "
Write-Host ".\.venv\Scripts\python.exe app.py"
Write-Host "-------------------------------------------"
