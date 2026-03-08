# Set Up Python Environment for TF.js Model Export

Use this to create a virtual environment and install TensorFlow so you can run `export_tfjs_model.py` and put the model in the backend.

**Windows note:** The full `tensorflowjs` package depends on `flax` → `uvloop`, and **uvloop does not support Windows**. So the export script will fail on Windows with an import error. Use **WSL** (see below) to run the export once, or run it on a Linux machine / CI.

**Note:** If you previously ran the setup script and got a venv in the wrong folder (`trae_projects\.venv`), delete that `.venv` folder and run the script again from inside `MAIZE_GUARD`.

---

## Export on Windows using WSL (recommended)

1. Install **WSL** from Microsoft Store (“Ubuntu” or “Windows Subsystem for Linux”) if you don’t have it.
2. Open **WSL** (Ubuntu) and run:
   ```bash
   cd /mnt/c/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD
   pip3 install tensorflow tensorflowjs
   python3 scripts/export_tfjs_model.py
   ```
3. The script will write `backend/public/models/tfjs/model.json` and weight files. Commit them and push so the backend (e.g. Render) serves the model.

---

## 1. Install Python 3.10 or 3.11 (for non-WSL / Linux)

TensorFlow works best with Python 3.10 or 3.11. If you have 3.14 and get errors, use one of these.

### Download and install

1. Go to **https://www.python.org/downloads/**
2. Download **Python 3.11.x** (or 3.10.x) for Windows.
3. Run the installer.
4. **Important:** On the first screen, check **"Add python.exe to PATH"**, then click **"Install Now"**.
5. Finish the installer.

### Check it

Open a **new** PowerShell or Command Prompt and run:

```powershell
python --version
```

You should see something like `Python 3.11.x`. If you see "not recognized", Python is not on PATH; reinstall and make sure "Add to PATH" was checked.

---

## 2. Create a virtual environment in the project

A virtual environment keeps TensorFlow and its dependencies separate from the rest of your system.

### In PowerShell (recommended)

Open PowerShell, go to your project, then run:

```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
python -m venv .venv
```

This creates a folder `.venv` in your project with an isolated Python.

### Activate the environment

**PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

If you get an error about script execution, run once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the activate command again.

**Command Prompt (cmd):**

```cmd
.venv\Scripts\activate.bat
```

When the environment is active, you’ll see `(.venv)` at the start of the line, for example:

```
(.venv) PS C:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD>
```

---

## 3. Install TensorFlow and TensorFlow.js in the environment

With the environment **activated** (you see `(.venv)`), run:

```powershell
pip install --upgrade pip
pip install tensorflow tensorflowjs
```

Wait until both install. This can take a few minutes.

---

## 4. Export the model and copy it to the backend

Still with the environment **activated**:

```powershell
python scripts/export_tfjs_model.py
```

This will:

- Build the TF.js model
- Save it under `assets/model-tfjs/`
- Copy it into `backend/public/models/tfjs/`

When it finishes, you should see “Backend folder updated” and the list of copied files.

---

## 5. Deactivate the environment (when you’re done)

When you’re finished with Python for the day:

```powershell
deactivate
```

You can close the terminal. Next time you want to run the export again, open a new terminal, go to the project, activate, then run the script:

```powershell
cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD
.\.venv\Scripts\Activate.ps1
python scripts/export_tfjs_model.py
```

---

## Quick reference

| Step | Command |
|------|--------|
| Go to project | `cd c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD` |
| Create venv (once) | `python -m venv .venv` |
| Activate (PowerShell) | `.\.venv\Scripts\Activate.ps1` |
| Activate (cmd) | `.venv\Scripts\activate.bat` |
| Install packages (once) | `pip install tensorflow tensorflowjs` |
| Export model | `python scripts/export_tfjs_model.py` |
| Deactivate | `deactivate` |

The `.venv` folder is in `.gitignore`, so it won’t be committed to Git.
