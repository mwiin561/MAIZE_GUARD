"""
Verify the exported ONNX model on PC.
Tests with synthetic inputs and compares against TorchScript for consistency.
"""
import os
import sys
import numpy as np

# Paths
base_dir = "c:/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD"
onnx_path = os.path.join(base_dir, "assets/models/maize_model.onnx")
pt_path = os.path.join(base_dir, "backend/tflite_service/model_torchscript.pt")

CLASS_NAMES = ["Healthy", "MSV", "Unknown"]

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def verify():
    # ---- Step 1: Load ONNX model ----
    try:
        import onnxruntime as ort
    except ImportError:
        print("❌ onnxruntime not installed. Run: pip install onnxruntime")
        return

    print(f"Loading ONNX model: {onnx_path}")
    if not os.path.exists(onnx_path):
        print(f"❌ ONNX model not found at {onnx_path}")
        return

    session = ort.InferenceSession(onnx_path)
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    output_name = session.get_outputs()[0].name
    print(f"✅ ONNX loaded. Input: {input_name} {input_shape}, Output: {output_name}")

    # ---- Step 2: Load TorchScript model for comparison ----
    try:
        import torch
        from torchvision import transforms
        from PIL import Image

        pt_model = torch.jit.load(pt_path, map_location="cpu")
        pt_model.eval()
        print(f"✅ TorchScript loaded for comparison.")
        has_torch = True
    except Exception as e:
        print(f"⚠️ TorchScript comparison unavailable: {e}")
        has_torch = False

    # ---- Step 3: Create test inputs ----
    # Test A: Random noise (should be "Unknown" or low confidence)
    # Test B: Solid green image (simulating a healthy leaf)
    # Test C: Green with yellow streaks (simulating MSV)
    
    test_cases = []
    
    # Test A: Random noise
    np.random.seed(42)
    noise = np.random.rand(1, 3, 224, 224).astype(np.float32)
    test_cases.append(("Random Noise", noise))
    
    # Test B: Solid green (like a healthy leaf - values after ToTensor which divides by 255)
    green = np.zeros((1, 3, 224, 224), dtype=np.float32)
    green[0, 0, :, :] = 0.2   # R low
    green[0, 1, :, :] = 0.6   # G high
    green[0, 2, :, :] = 0.15  # B low
    test_cases.append(("Solid Green", green))
    
    # Test C: Green with yellow streaks (MSV-like pattern)
    msv = np.zeros((1, 3, 224, 224), dtype=np.float32)
    msv[0, 0, :, :] = 0.2   # Base R
    msv[0, 1, :, :] = 0.6   # Base G
    msv[0, 2, :, :] = 0.15  # Base B
    # Add yellow streaks every 10 rows
    for row in range(0, 224, 10):
        msv[0, 0, row:row+3, :] = 0.9  # Yellow R
        msv[0, 1, row:row+3, :] = 0.9  # Yellow G
        msv[0, 2, row:row+3, :] = 0.1  # Yellow B low
    test_cases.append(("Green+Yellow Streaks", msv))

    # ---- Step 4: Run inference ----
    print("\n" + "="*60)
    print("ONNX vs TorchScript Comparison")
    print("="*60)
    
    all_match = True
    for name, input_data in test_cases:
        # ONNX inference
        onnx_output = session.run([output_name], {input_name: input_data})[0]
        onnx_probs = softmax(onnx_output[0])
        onnx_idx = int(np.argmax(onnx_probs))
        onnx_conf = float(onnx_probs[onnx_idx])
        onnx_label = CLASS_NAMES[onnx_idx]
        
        print(f"\n--- {name} ---")
        print(f"  ONNX:   {onnx_label} ({onnx_conf:.4f}) | Scores: {[f'{p:.4f}' for p in onnx_probs]}")
        
        if has_torch:
            # TorchScript inference
            pt_input = torch.from_numpy(input_data)
            with torch.no_grad():
                pt_output = pt_model(pt_input)
                pt_probs = torch.nn.functional.softmax(pt_output[0], dim=0)
                pt_idx = int(torch.argmax(pt_probs))
                pt_conf = float(pt_probs[pt_idx].item())
                pt_label = CLASS_NAMES[pt_idx]
            
            print(f"  Torch:  {pt_label} ({pt_conf:.4f}) | Scores: {[f'{p:.4f}' for p in pt_probs.numpy()]}")
            
            # Check if they match
            match = onnx_label == pt_label and abs(onnx_conf - pt_conf) < 0.01
            status = "✅ MATCH" if match else "❌ MISMATCH"
            print(f"  Status: {status}")
            if not match:
                all_match = False
        else:
            print(f"  (No TorchScript comparison available)")

    print("\n" + "="*60)
    if has_torch:
        if all_match:
            print("✅ ALL TESTS PASSED: ONNX perfectly matches TorchScript!")
            print("   The unified model is ready for mobile deployment.")
        else:
            print("⚠️ SOME MISMATCHES: The ONNX model differs from TorchScript.")
            print("   This may require further investigation.")
    else:
        print("ONNX model loaded and ran successfully.")
    print("="*60)

    # ---- Step 5: Test with a real image if available ----
    test_img_dirs = [
        os.path.join(base_dir, "backend/uploads"),
        os.path.join(base_dir, "test_images"),
        os.path.join(base_dir, "backend/tflite_service/test_images"),
    ]
    
    real_image = None
    for d in test_img_dirs:
        if os.path.exists(d):
            for f in os.listdir(d):
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    real_image = os.path.join(d, f)
                    break
        if real_image:
            break
    
    if real_image and has_torch:
        print(f"\n--- Real Image Test: {os.path.basename(real_image)} ---")
        try:
            img = Image.open(real_image).convert("RGB")
            preprocess = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor()
            ])
            img_tensor = preprocess(img).unsqueeze(0)
            img_np = img_tensor.numpy()
            
            # ONNX
            onnx_out = session.run([output_name], {input_name: img_np})[0]
            onnx_p = softmax(onnx_out[0])
            print(f"  ONNX:  {CLASS_NAMES[np.argmax(onnx_p)]} ({np.max(onnx_p):.4f})")
            
            # Torch
            with torch.no_grad():
                pt_out = pt_model(img_tensor)
                pt_p = torch.nn.functional.softmax(pt_out[0], dim=0).numpy()
            print(f"  Torch: {CLASS_NAMES[np.argmax(pt_p)]} ({np.max(pt_p):.4f})")
        except Exception as e:
            print(f"  Error testing real image: {e}")

if __name__ == "__main__":
    verify()
