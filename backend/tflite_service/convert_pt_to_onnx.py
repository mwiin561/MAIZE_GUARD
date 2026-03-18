import torch
import torch.nn as nn
import os

# Load the TorchScript model
PT_PATH = "model_torchscript.pt"
ONNX_PATH = "model.onnx"

def convert():
    print(f"Loading PyTorch model from {PT_PATH}...")
    if not os.path.exists(PT_PATH):
        print("❌ Error: PyTorch model not found!")
        return

    model = torch.jit.load(PT_PATH, map_location=torch.device('cpu'))
    model.eval()

    # Create dummy input based on model_info.json [224, 224]
    dummy_input = torch.randn(1, 3, 224, 224)

    print(f"Exporting to ONNX: {ONNX_PATH}...")
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("✅ ONNX conversion complete!")

if __name__ == "__main__":
    convert()
