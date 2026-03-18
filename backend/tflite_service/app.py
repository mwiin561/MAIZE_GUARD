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
# Check for both names, prioritize the one found in the folder
MODEL_PATH = os.path.join(SCRIPT_DIR, "model_torchscript.pt")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(SCRIPT_DIR, "model.pt")

INPUT_SIZE = 224

app = Flask(__name__)

# Global model and transform
model = None
preprocess = transforms.Compose([
    transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
    transforms.ToTensor(),
    # Standard ImageNet normalization - REQUIRED for most pre-trained PyTorch models
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def load_model():
    global model
    if not os.path.isfile(MODEL_PATH):
        print(f"❌ Error: Model file not found. Please place 'model.pt' or 'model_torchscript.pt' in: {SCRIPT_DIR}")
        return False
    try:
        # Use torch.jit.load for TorchScript models (.pt files usually are)
        # falling back to torch.load if that fails
        try:
            model = torch.jit.load(MODEL_PATH, map_location=torch.device('cpu'))
            print("✨ Loaded Model using TorchScript (jit)")
        except Exception:
            model = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
            print("✅ Loaded Model using standard torch.load")
        
        model.eval()
        print(f"🚀 AI Service Ready with: {os.path.basename(MODEL_PATH)}")
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
        # Load and define all variations
        img_raw = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # 1. Raw [0, 1] RGB
        transform_raw = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor()])
        tensor_raw = transform_raw(img_raw).unsqueeze(0)
        
        # 2. ImageNet Normalized RGB
        transform_norm = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        tensor_norm = transform_norm(img_raw).unsqueeze(0)
        
        # 3. BGR [0, 1]
        r, g, b = img_raw.split()
        img_bgr = Image.merge('RGB', (b, g, r))
        tensor_bgr = transform_raw(img_bgr).unsqueeze(0)

        # 4. Raw [0, 255] (No scaling)
        tensor_255 = tensor_raw * 255.0

        variations = [
            ("RAW RGB", tensor_raw),
            ("IMAGENET", tensor_norm),
            ("BGR", tensor_bgr),
            ("RAW 255", tensor_255)
        ]

        results = []
        print(f"\n🧪 BRUTE FORCE DIAGNOSTIC TEST:")
        for name, tensor in variations:
            with torch.no_grad():
                output = model(tensor)
                probs = torch.nn.functional.softmax(output[0], dim=0)
                win = int(torch.argmax(probs))
                conf = float(probs[win].item())
                results.append({"name": name, "winner": win, "conf": conf, "scores": probs.tolist()})
                print(f"  - {name:8}: Winner={win}, Conf={conf:.4f}")

        # Pick the best result for the response
        best_run = max(results, key=lambda x: x['conf'] if x['winner'] != 2 else -1.0)
        # If all are Class 2, just pick the first one
        if best_run['winner'] == 2:
            best_run = results[0]

        best_class = best_run['winner']
        confidence = best_run['conf']
        labels = ["Healthy Maize", "Maize Streak Virus", "Not a Maize Leaf"]
        diagnosis = labels[best_class] if best_class < len(labels) else f"Class {best_class}"

        return jsonify({
            "diagnosis": diagnosis,
            "confidence": float(round(confidence, 4)),
            "isHealthy": best_class == 0,
            "isInfected": best_class == 1,
            "isMaize": best_class != 2,
            "class_index": best_class,
            "best_fix": best_run['name'],
            "all_runs": results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    if not load_model():
        print("⚠️ Model file missing. Place 'model.pt' in this folder.")
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port)
