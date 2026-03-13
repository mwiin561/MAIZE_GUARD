r"""
Local TFLite inference service for the real v2 model.
Run this when you want to test the actual model (not the placeholder) before building the APK.

Usage:
  cd backend/tflite_service
  pip install -r requirements.txt
  set MODEL_PATH=..\public\models\v2\model.tflite   (optional; default below)
  python app.py

Then set in backend/.env:  TFLITE_SERVICE_URL=http://localhost:5003
Start the Node backend and use the app; scans will use the real v2 model.
"""
import os
import sys
import base64
import re
from io import BytesIO

from flask import Flask, request, jsonify

# Default: backend/public/models/v2/model.tflite relative to this script's parent
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_MODEL_PATH = os.path.join(BACKEND_DIR, "public", "models", "v2", "model.tflite")

MODEL_PATH = os.environ.get("MODEL_PATH", DEFAULT_MODEL_PATH)
INPUT_SIZE = 224
NUM_CLASSES = 2  # 0 = Healthy, 1 = Maize Streak Virus

app = Flask(__name__)

interpreter = None


def load_model():
    global interpreter
    if not os.path.isfile(MODEL_PATH):
        print(f"ERROR: Model file not found: {MODEL_PATH}", file=sys.stderr)
        print("Set MODEL_PATH to your v2 model.tflite or place it at backend/public/models/v2/model.tflite", file=sys.stderr)
        return False
    try:
        try:
            import tflite_runtime.interpreter as tflite
        except ImportError:
            import tensorflow as tf
            tflite = tf.lite
        interpreter = tflite.Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()
        print(f"Loaded TFLite model: {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"Failed to load model: {e}", file=sys.stderr)
        print("If pip install failed (Python 3.13+), use Python 3.11: py -3.11 -m venv .venv", file=sys.stderr)
        return False


# Reject images that are too dark (e.g. camera covered) before running the model
MIN_MEAN_BRIGHTNESS = 0.08  # 0-1 scale; below this = effectively black


def preprocess_image(image_bytes):
    """Decode image, resize to INPUT_SIZE, normalize to [0,1] float32."""
    from PIL import Image
    import numpy as np
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img = img.resize((INPUT_SIZE, INPUT_SIZE), Image.Resampling.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # shape (1, 224, 224, 3)


def is_image_too_dark(input_arr):
    """Return True if image is essentially black (camera covered / no light)."""
    import numpy as np
    mean_brightness = float(np.mean(input_arr))
    return mean_brightness < MIN_MEAN_BRIGHTNESS


def run_inference(input_data):
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"])
    return output.flatten().tolist()


def parse_predictions(predictions):
    if not predictions or len(predictions) < 2:
        return {"isInvalid": True, "diagnosis": "Error", "confidence": 0, "raw": predictions or []}
    healthy = float(predictions[0])
    msv = float(predictions[1])
    # Softmax-style outputs: use as probabilities
    total = healthy + msv
    if total > 0:
        healthy, msv = healthy / total, msv / total
    is_very_sure = max(msv, healthy) > 0.85
    is_ambiguous = abs(msv - healthy) < 0.2
    if not is_very_sure or is_ambiguous:
        return {
            "isInvalid": True,
            "diagnosis": "Uncertain",
            "confidence": max(msv, healthy),
            "raw": predictions,
        }
    return {
        "isInvalid": False,
        "isInfected": msv > 0.5,
        "confidence": max(msv, healthy),
        "diagnosis": "Maize Streak Virus" if msv > 0.5 else "Healthy",
        "raw": predictions,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": interpreter is not None, "model_path": MODEL_PATH})


@app.route("/predict", methods=["POST"])
def predict():
    if interpreter is None:
        return jsonify({"error": "Model not loaded"}), 503

    image_bytes = None

    # 1) JSON body with base64 imageData (same as upload-image-web)
    if request.is_json:
        data = request.get_json() or {}
        image_data = data.get("imageData")
        if image_data and isinstance(image_data, str):
            m = re.match(r"^data:(.+);base64,(.+)$", image_data)
            if m:
                image_bytes = base64.b64decode(m.group(2))

    # 2) Multipart form file "image"
    if image_bytes is None and "image" in request.files:
        f = request.files["image"]
        if f and f.filename:
            image_bytes = f.read()

    # 3) Raw body as image
    if image_bytes is None and request.data:
        image_bytes = request.data

    if not image_bytes:
        return jsonify({"error": "No image provided. Use imageData (base64), multipart 'image', or raw body."}), 400

    try:
        input_arr = preprocess_image(image_bytes)
        # Reject black / camera-covered images so they are not classified as Healthy
        if is_image_too_dark(input_arr):
            return jsonify({
                "isInvalid": True,
                "diagnosis": "Invalid Image",
                "confidence": 0,
                "raw": [],
            })
        predictions = run_inference(input_arr)
        result = parse_predictions(predictions)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    if not load_model():
        sys.exit(1)
    port = int(os.environ.get("PORT", 5003))
    print(f"TFLite service listening on http://localhost:{port}")
    print("POST /predict with imageData (base64) or multipart 'image'")
    app.run(host="0.0.0.0", port=port, debug=False)
