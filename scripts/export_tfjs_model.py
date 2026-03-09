"""
Step 2 (optional): Export a minimal TF.js model for on-device inference.

This creates a small Keras model with the same interface as your maize classifier:
  - Input: (224, 224, 3) RGB image, normalized 0–1
  - Output: 2 classes (index 0 = Healthy, index 1 = Maize Streak Virus)

Run once to generate assets/model-tfjs/model.json and weight shards.
Replace this minimal model with your real model by training in Keras and
exporting with: tensorflowjs_converter --input_format=keras your_model.h5 assets/model-tfjs

Requirements: pip install tensorflow tensorflowjs
"""

import os
import sys

# Ensure pkg_resources is available before tensorflowjs (needed by some deps on Python 3.12+)
try:
    import pkg_resources  # noqa: F401
except ImportError:
    import setuptools  # noqa: F401

def main():
    try:
        import tensorflow as tf
        from tensorflow import keras
    except ImportError:
        print("Install: pip install tensorflow tensorflowjs")
        sys.exit(1)

    try:
        import tensorflowjs as tfjs
    except ImportError as e:
        print("tensorflowjs import failed:", e)
        print("")
        print("On Windows, tensorflowjs needs 'flax', which pulls in uvloop (not supported on Windows).")
        print("Run the export in WSL (Windows Subsystem for Linux) once:")
        print("  1. Install WSL from Microsoft Store if needed, then open a WSL terminal.")
        print("  2. cd /mnt/c/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD")
        print("  3. pip3 install tensorflow tensorflowjs")
        print("  4. python3 scripts/export_tfjs_model.py")
        print("  5. Copy backend/public/models/tfjs/* into your repo and commit.")
        sys.exit(1)

    # Same input shape as backend (224x224 RGB)
    INPUT_SHAPE = (224, 224, 3)
    NUM_CLASSES = 2  # Healthy, Maize Streak Virus

    model = keras.Sequential([
        keras.layers.InputLayer(input_shape=INPUT_SHAPE),
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dense(32, activation="relu"),
        keras.layers.Dense(NUM_CLASSES, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "..")
    assets_dir = os.path.join(project_root, "assets", "model-tfjs")
    backend_dir = os.path.join(project_root, "backend", "public", "models", "tfjs")

    os.makedirs(assets_dir, exist_ok=True)
    tfjs.converters.save_keras_model(model, assets_dir)
    print("TF.js model saved to:", os.path.abspath(assets_dir))

    os.makedirs(backend_dir, exist_ok=True)
    import shutil
    for name in os.listdir(assets_dir):
        src = os.path.join(assets_dir, name)
        dst = os.path.join(backend_dir, name)
        if os.path.isfile(src):
            shutil.copy2(src, dst)
            print("  Copied to backend:", name)
    print("")
    print("Backend folder updated:", os.path.abspath(backend_dir))
    print("Deploy the backend (push to Render) so the app can load the model.")

if __name__ == "__main__":
    main()
