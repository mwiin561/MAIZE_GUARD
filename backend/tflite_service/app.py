import os
import sys
import base64
import re
from io import BytesIO
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from flask import Flask, request, jsonify

# Path configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "model.pt")
INPUT_SIZE = 224

app = Flask(__name__)

# Global model and transform
model = None
preprocess = transforms.Compose([
    transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def load_model():
    global model
    if not os.path.isfile(MODEL_PATH):
        print(f"ERROR: PyTorch model not found: {MODEL_PATH}")
        return False
    try:
        # Load the model (expecting a scripted or full model for simplicity)
        # If it's just weights, we'd need the class definition.
        # We'll use 'torch.load' with 'weights_only=False' for flexibility with .pt files
        model = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        model.eval()
        print(f"✅ Loaded PyTorch model: {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok" if model else "model_not_loaded", "type": "pytorch"})

@app.route("/predict", methods=["POST"])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 503

    image_bytes = None
    if request.is_json:
        data = request.get_json() or {}
        image_data = data.get("imageData")
        if image_data and isinstance(image_data, str):
            m = re.match(r"^data:(.+);base64,(.+)$", image_data)
            if m:
                image_bytes = base64.b64decode(m.group(2))

    if image_bytes is None and "image" in request.files:
        image_bytes = request.files["image"].read()

    if not image_bytes:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Preprocess
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        input_tensor = preprocess(img).unsqueeze(0)

        # Inference
        with torch.no_grad():
            output = model(input_tensor)
            
        # Assuming classification output (logits)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        
        # We assume 0 is Healthy, 1 is MSV based on your previous config
        # If your model has more classes, we can expand this
        healthy_conf = float(probabilities[0])
        msv_conf = float(probabilities[1])
        
        diagnosis = "Maize Streak Virus" if msv_conf > healthy_conf else "Healthy"
        confidence = max(msv_conf, healthy_conf)

        return jsonify({
            "diagnosis": diagnosis,
            "confidence": round(confidence, 4),
            "isInfected": msv_conf > healthy_conf,
            "isHealthy": healthy_conf >= msv_conf,
            "raw_scores": probabilities.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    if not load_model():
        print("⚠️ Model file missing. Place 'model.pt' in this folder.")
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port)
