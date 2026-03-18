import os
import sys
from PIL import Image
import numpy as np

# Use a recent image from the uploads folder
IMAGE_PATH = r"c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\public\uploads\scan-1773743566985.jpg"
PT_MODEL_PATH = "model_torchscript.pt"
TFLITE_MODEL_PATH = r"c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\public\models\v2\model.tflite"

def test_pytorch():
    try:
        import torch
        from torchvision import transforms
        print(f"\n--- Testing PyTorch Model ({PT_MODEL_PATH}) ---")
        if not os.path.exists(PT_MODEL_PATH):
            print(f"❌ PT Model not found at {PT_MODEL_PATH}!")
            return

        model = torch.jit.load(PT_MODEL_PATH, map_location=torch.device('cpu'))
        model.eval()
        
        img = Image.open(IMAGE_PATH).convert("RGB")
        
        # Golden Recipe for PT: Bilinear Resize (default) + ToTensor (no norm)
        preprocess = transforms.Compose([
            transforms.Resize((224, 224), interpolation=transforms.InterpolationMode.BILINEAR), 
            transforms.ToTensor()
        ])
        input_tensor = preprocess(img).unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_tensor)
            probs = torch.nn.functional.softmax(output[0], dim=0)
            win = int(torch.argmax(probs))
            conf = float(probs[win].item())
            print(f"Result: Class {win}, Conf: {conf:.4f}")
            print(f"Scores: {probs.tolist()}")
            
            labels = ["Healthy", "MSV", "Unknown"]
            print(f"Diagnosis: {labels[win]}")
    except ImportError:
        print("⏭️ Skipping PyTorch Test (torch not installed in this venv)")
    except Exception as e:
        print(f"❌ PT Error: {e}")

def test_tflite():
    print(f"\n--- Testing TFLite Model ({TFLITE_MODEL_PATH}) ---")
    if not os.path.exists(TFLITE_MODEL_PATH):
        print(f"❌ TFLite Model not found at {TFLITE_MODEL_PATH}!")
        return

    try:
        import tensorflow as tf
        interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
        
        print("✅ Interpreter loaded. Allocating tensors...")
        interpreter.allocate_tensors()
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        img = Image.open(IMAGE_PATH).convert("RGB")
        img = img.resize((224, 224), Image.BILINEAR)
        
        # Golden Recipe for TFL: Match the scaling [0, 1] 
        input_data = np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

        interpreter.set_tensor(input_details[0]['index'], input_data)
        print("🚀 Invoking TFLite model...")
        interpreter.invoke()
        
        output_data = interpreter.get_tensor(output_details[0]['index'])[0]
        
        # Softmax if output type is logits (assuming it mimics PT)
        exp_scores = np.exp(output_data - np.max(output_data))
        probs = exp_scores / exp_scores.sum()
        
        win = np.argmax(probs)
        conf = probs[win]
        print(f"Result: Class {win}, Conf: {conf:.4f}")
        print(f"Scores: {probs.tolist()}")
        
        labels = ["Healthy", "MSV", "Unknown"]
        print(f"Diagnosis: {labels[win]}")
    except ImportError:
        print("⏭️ Skipping TFLite Test (tensorflow not installed)")
    except Exception as e:
        print(f"❌ TFLite Error: {e}")

if __name__ == "__main__":
    if os.path.exists(IMAGE_PATH):
        print(f"📁 Testing with image: {IMAGE_PATH}")
        test_pytorch()
        test_tflite()
    else:
        print(f"❌ Test image not found at: {IMAGE_PATH}")
