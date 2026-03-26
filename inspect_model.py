import torch
import torch.nn as nn
import os

PT_PATH = r"c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\tflite_service\model_torchscript.pt"

def inspect_model():
    if not os.path.exists(PT_PATH):
        print(f"Error: {PT_PATH} not found")
        return

    try:
        model = torch.jit.load(PT_PATH, map_location=torch.device('cpu'))
        print("--- Model Information ---")
        print(f"File: {PT_PATH}")
        
        from PIL import Image
        import numpy as np
        
        IMAGE_PATH = r"c:\Users\CLIENT\Documents\trae_projects\MAIZE_GUARD\backend\public\uploads\scan-1773743566985.jpg"
        if os.path.exists(IMAGE_PATH):
            img = Image.open(IMAGE_PATH).convert("RGB").resize((224, 224))
            img_np = np.array(img).astype(np.float32) / 255.0
            
            # Test 1: No Norm
            tensor_no_norm = torch.from_numpy(img_np.transpose(2, 0, 1)).unsqueeze(0)
            
            # Test 2: ImageNet Norm
            mean = np.array([0.485, 0.456, 0.406]).reshape(1, 1, 3)
            std = np.array([0.229, 0.224, 0.225]).reshape(1, 1, 3)
            img_norm = (img_np - mean) / std
            tensor_norm = torch.from_numpy(img_norm.transpose(2, 0, 1)).unsqueeze(0)
            
            for name, tensor in [("Real Image (No Norm)", tensor_no_norm), 
                                 ("Real Image (ImageNet Norm)", tensor_norm)]:
                output = model(tensor.float())
                print(f"\n--- Input: {name} ---")
                print(f"  Logits: {output[0].tolist()}")
                probs = torch.nn.functional.softmax(output[0], dim=0)
                print(f"  Softmax: {probs.tolist()}")
                top_idx = torch.argmax(probs).item()
                print(f"  Pred: {['Healthy', 'MSV', 'Unknown'][top_idx]} ({probs[top_idx]:.4f})")
                
    except Exception as e:
        print(f"Error inspecting model: {e}")

if __name__ == "__main__":
    inspect_model()
