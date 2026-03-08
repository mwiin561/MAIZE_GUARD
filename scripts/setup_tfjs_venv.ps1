# Create and set up Python virtual environment for TF.js model export
# Run from project root: .\scripts\setup_tfjs_venv.ps1
# Requires Python 3.10 or 3.11 (TensorFlow does not support 3.13+). Install from https://www.python.org/downloads/

$ErrorActionPreference = "Stop"
# Script lives in MAIZE_GUARD/scripts, so one level up = project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Project root: $ProjectRoot" -ForegroundColor Cyan

# 1. Create venv if it doesn't exist. Prefer Python 3.10-3.12 (TensorFlow has no wheels for 3.13+).
$venvPath = Join-Path $ProjectRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment at .venv ..." -ForegroundColor Yellow
    $created = $false
    foreach ($py in @("py -3.11", "py -3.10", "py -3.12", "python")) {
        Invoke-Expression "& $py -m venv .venv" 2>$null
        if (Test-Path (Join-Path $ProjectRoot ".venv\Scripts\python.exe")) {
            Write-Host "Created venv with: $py" -ForegroundColor Cyan
            $created = $true
            break
        }
    }
    if (-not $created) { throw "Failed to create venv. Install Python 3.11 from https://www.python.org/downloads/ (Add to PATH), then run this script again." }
    Write-Host "Done." -ForegroundColor Green
} else {
    Write-Host "Virtual environment .venv already exists." -ForegroundColor Green
}

# 2. Install packages. On Windows use --no-deps for tensorflowjs to avoid slow backtracking and uvloop.
$venvPip = Join-Path $venvPath "Scripts\pip.exe"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
Write-Host "Installing tensorflow in .venv ..." -ForegroundColor Yellow
& $venvPip install tensorflow
if ($LASTEXITCODE -ne 0) {
    Write-Host "TensorFlow install failed." -ForegroundColor Red
    exit 1
}
Write-Host "Installing tensorflowjs (minimal deps; full converter needs Linux/WSL - see scripts/README_TFJS_SETUP.md) ..." -ForegroundColor Yellow
& $venvPip install tensorflowjs --no-deps
& $venvPip install tensorflow-hub importlib_resources
if ($LASTEXITCODE -ne 0) {
    Write-Host "TensorFlow/TF.js install failed." -ForegroundColor Red
    exit 1
}
Write-Host "Packages installed." -ForegroundColor Green

# 3. Run export script with venv's Python
Write-Host "Running export_tfjs_model.py ..." -ForegroundColor Yellow
& $venvPython scripts/export_tfjs_model.py
if ($LASTEXITCODE -ne 0) { throw "Export script failed." }

Write-Host ""
Write-Host "Setup complete. Model is in backend/public/models/tfjs/" -ForegroundColor Green
Write-Host "Next: commit and push the backend so Render serves the model." -ForegroundColor Cyan
