import os
import sys
import base64
import re
import json
from io import BytesIO
import torch
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify

# Path configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "model_torchscript.pt")
INFO_PATH = os.path.join(SCRIPT_DIR, "model_info.json")

# Default Parameters (The "Lean" from previous successful deployment)
# 1. Classes: Healthy (0), MSV (1), Unknown (2)
# 2. Input: 224x224 RGB
# 3. Preprocessing: Resize (Bilinear) + ToTensor (ONLY)
# 4. Confidence Threshold: 0.7
CONFIG = {
    "input_size": [224, 224],
    "class_names": ["Healthy", "MSV", "Unknown"],
    "confidence_threshold": 0.7,
    "normalize": False,
    "interpolation": "bilinear"
}

app = Flask(__name__)
model = None

def load_config():
    global CONFIG
    if os.path.exists(INFO_PATH):
        try:
            with open(INFO_PATH, 'r') as f:
                data = json.load(f)
                # Merge user-provided specifics
                if 'class_names' in data: CONFIG['class_names'] = data['class_names']
                if 'confidence_threshold' in data: CONFIG['confidence_threshold'] = data['confidence_threshold']
                if 'preprocessing' in data:
                    prep = data['preprocessing']
                    CONFIG['normalize'] = prep.get('normalize', False)
                    CONFIG['input_size'] = prep.get('resize', [224, 224])
                    CONFIG['interpolation'] = prep.get('interpolation', 'bilinear')
            print("📜 Inference parameters loaded from config.")
        except Exception as e:
            print(f"⚠️ Warning: Could not parse config, using defaults: {e}")

def load_model():
    global model
    if not os.path.isfile(MODEL_PATH):
        print(f"❌ Error: Model file missing: {MODEL_PATH}")
        return False
    try:
        model = torch.jit.load(MODEL_PATH, map_location=torch.device('cpu'))
        model.eval()
        print(f"✨ Model Ready: {os.path.basename(MODEL_PATH)}")
        return True
    except Exception as e:
        print(f"❌ Model Load Failure: {e}")
        return False

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok" if model else "error",
        "type": "pytorch_jit",
        "parameters": CONFIG
    })

@app.route("/predict", methods=["POST"])
def predict():
    if not model:
        return jsonify({"error": "Model initialization failed"}), 503

    image_bytes = None
    if request.is_json:
        data = request.get_json() or {}
        image_data = data.get("imageData")
        if image_data and isinstance(image_data, str):
            m = re.match(r"^data:(.+);base64,(.+)$", image_data)
            if m: image_bytes = base64.b64decode(m.group(2))

    if image_bytes is None and "image" in request.files:
        image_bytes = request.files["image"].read()

    if not image_bytes:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Step 1: Open and Convert
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Step 2: Set Interpolation based on "Golden Recipe"
        interp = Image.BILINEAR
        if CONFIG.get('interpolation') == 'nearest': interp = Image.NEAREST
        elif CONFIG.get('interpolation') == 'bicubic': interp = Image.BICUBIC

        # Step 3: Build Minimalist Transform (No Norm is key here)
        t_list = [
            transforms.Resize(tuple(CONFIG['input_size']), interpolation=interp),
            transforms.ToTensor()
        ]
        
        if CONFIG.get('normalize'):
            t_list.append(transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]))
        
        preprocess = transforms.Compose(t_list)
        input_tensor = preprocess(img).unsqueeze(0)

        # Step 4: Inference
        with torch.no_grad():
            output = model(input_tensor)
            # Softmax is required to interpret the 3 output classes correctly
            probs = torch.nn.functional.softmax(output[0], dim=0)
            
            top_idx = int(torch.argmax(probs))
            conf = float(probs[top_idx].item())
            
        labels = CONFIG.get("class_names", ["Healthy", "MSV", "Unknown"])
        prediction = labels[top_idx] if top_idx < len(labels) else "Unknown"

        # Step 5: Final Logic (Applying the Rejection Rules)
        # Class 2 (Unknown) is a manual rejection.
        # Low confidence (<0.7) is a system rejection.
        
        threshold = CONFIG.get("confidence_threshold", 0.7)
        
        if prediction == "Unknown":
            diagnosis = "Not a Maize Leaf"
            is_valid = False
        elif conf < threshold:
            diagnosis = "Uncertain Scan"
            is_valid = False
        else:
            diagnosis = prediction
            is_valid = True

        print(f"🔮 Prediction: {prediction} ({conf:.4f}) -> {diagnosis}")

        return jsonify({
            "diagnosis": diagnosis,
            "raw_class": prediction,
            "confidence": float(round(conf, 4)),
            "isHealthy": diagnosis == "Healthy",
            "isInfected": diagnosis == "MSV",
            "isMaize": is_valid,
            "class_index": top_idx,
            "scores": probs.tolist()
        })
    except Exception as e:
        print(f"❌ Execution Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    load_config()
    if not load_model():
        sys.exit(1)
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port)
