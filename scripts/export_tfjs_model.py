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

def main():
    try:
        import tensorflow as tf
        from tensorflow import keras
    except ImportError:
        print("Install: pip install tensorflow tensorflowjs")
        sys.exit(1)

    try:
        import tensorflowjs as tfjs
    except ImportError:
        print("Install: pip install tensorflowjs")
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

    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "model-tfjs")
    os.makedirs(out_dir, exist_ok=True)
    tfjs.converters.save_keras_model(model, out_dir)
    print("TF.js model saved to:", os.path.abspath(out_dir))

if __name__ == "__main__":
    main()
