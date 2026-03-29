import torch
import os
import sys

# Paths
base_dir = "c:/Users/CLIENT/Documents/trae_projects/MAIZE_GUARD"
model_path = os.path.join(base_dir, "backend/tflite_service/model_torchscript.pt")
onnx_path = os.path.join(base_dir, "assets/models/maize_model.onnx")

def export():
    print(f"Loading TorchScript model: {model_path}")
    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}")
        return

    try:
        # Load the JIT model
        model = torch.jit.load(model_path, map_location="cpu")
        model.eval()
        print("Model loaded successfully.")

        # Create dummy input based on config (1, 3, 224, 224)
        dummy_input = torch.randn(1, 3, 224, 224)

        # Ensure output directory exists
        os.makedirs(os.path.dirname(onnx_path), exist_ok=True)

        print(f"Exporting to ONNX: {onnx_path}...")
        # In some PT 2.x versions, we can force the legacy exporter by using 
        # the specific internal function if the public one is failing with dynamo.
        from torch.onnx.utils import export as legacy_export
        
        legacy_export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=12,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output']
        )
        print("✅ Export complete!")

    except Exception as e:
        print(f"❌ Export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    export()
