"""
Test the ONNX model against the real user-provided images.
"""
import os
import sys
import numpy as np
from PIL import Image

base_dir = "c:/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD"
onnx_path = os.path.join(base_dir, "assets/models/maize_model.onnx")
artifact_dir = "C:/Users/CLIENT/.gemini/antigravity/brain/739178af-01e5-4baa-b49e-33839aeef601"

CLASS_NAMES = ["Healthy", "MSV", "Unknown"]
CONFIDENCE_THRESHOLD = 0.7

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def preprocess(image_path):
    """Exact same preprocessing as ModelService.native.js and app.py:
       - Resize to 224x224 (bilinear)
       - Convert pixels to [0,1] range (ToTensor equivalent)
       - NO normalization
       - Output shape: [1, 3, 224, 224] (NCHW)
    """
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0         # HWC, [0,1]
    arr = np.transpose(arr, (2, 0, 1))                    # CHW
    arr = np.expand_dims(arr, axis=0)                     # NCHW
    return arr

def run_test():
    import onnxruntime as ort

    session = ort.InferenceSession(onnx_path)
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    # The 4 images the user just provided
    test_images = [
        ("media__1774626957595.jpg", "CAMERA - Healthy leaf (expected: Healthy)"),
        ("media__1774626973801.jpg", "CAMERA - Healthy leaf (expected: Healthy)"),
        ("media__1774626978343.jpg", "CAMERA - Healthy leaf (expected: Healthy)"),
        ("media__1774627041581.jpg", "WEB     - MSV leaf (expected: MSV)"),
    ]

    print("="*70)
    print("REAL IMAGE TEST: ONNX Model vs. User Provided Images")
    print(f"Preprocessing: Resize(224,224) + /255.0 | No normalize | NCHW")
    print("="*70)

    for filename, label in test_images:
        image_path = os.path.join(artifact_dir, filename)
        if not os.path.exists(image_path):
            print(f"\n[MISSING] {filename}")
            continue

        img_arr = preprocess(image_path)
        mean_brightness = float(np.mean(img_arr))

        output = session.run([output_name], {input_name: img_arr})[0]
        probs = softmax(output[0])
        top_idx = int(np.argmax(probs))
        top_conf = float(probs[top_idx])
        top_label = CLASS_NAMES[top_idx]

        # Apply the same logic as app.py
        if top_label == "Unknown":
            diagnosis = "Not a Maize Leaf"
        elif top_conf < CONFIDENCE_THRESHOLD:
            diagnosis = "Uncertain Scan"
        else:
            diagnosis = top_label

        print(f"\n📷 {label}")
        print(f"   Mean Brightness: {mean_brightness:.4f}")
        print(f"   Raw Scores:  H={probs[0]:.4f}  MSV={probs[1]:.4f}  Unknown={probs[2]:.4f}")
        print(f"   Top Class:   {top_label} ({top_conf:.4f})")
        print(f"   → App shows: {diagnosis}")

    print("\n" + "="*70)

if __name__ == "__main__":
    run_test()
