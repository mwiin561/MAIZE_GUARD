# TF.js model for on-device inference

The app loads the TensorFlow.js model from this URL: `{BACKEND_ORIGIN}/public/models/tfjs/model.json`.

**To add the model:**

1. From the project root, run:
   ```bash
   pip install tensorflow tensorflowjs
   python scripts/export_tfjs_model.py
   ```
2. Copy everything from `assets/model-tfjs/` into this folder (`backend/public/models/tfjs/`).
3. Deploy the backend (or run it locally). The app will load the model from here and run inference on the device.

You can replace the minimal exported model with your real trained model by exporting your Keras model to TF.js and placing `model.json` and the `.bin` weight file(s) here.
