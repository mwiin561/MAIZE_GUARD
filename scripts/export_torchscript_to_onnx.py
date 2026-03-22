#!/usr/bin/env python3
"""
Export assets/model_torchscript.pt (TorchScript) -> assets/model.onnx for the React Native app.

The mobile app uses ONNX Runtime (onnxruntime-react-native), not PyTorch, so you must run
this script whenever you update model_torchscript.pt.

Usage (from project root):
  pip install -r scripts/requirements-export-onnx.txt
  python scripts/export_torchscript_to_onnx.py

(PyTorch's ONNX exporter requires both `torch` and the `onnx` package.)

Then copy the ONNX into the Metro-bundled filename the app expects:
  copy assets\\model.onnx assets\\model.onnx.mp4
  # or on Unix: cp assets/model.onnx assets/model.onnx.mp4

(Metro uses the fake .mp4 extension so the binary is bundled as an asset.)
"""
from __future__ import annotations

import os
import shutil
import sys

# Project root = parent of scripts/
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PT_PATH = os.path.join(ROOT, "assets", "model_torchscript.pt")
ONNX_OUT = os.path.join(ROOT, "assets", "model.onnx")
MP4_ALIAS = os.path.join(ROOT, "assets", "model.onnx.mp4")

# Match ModelService.native.js preprocessing: NCHW, 224x224, 3 channels
INPUT_SIZE = 224


def main() -> int:
    try:
        import torch
    except ImportError:
        print("Install: pip install -r scripts/requirements-export-onnx.txt", file=sys.stderr)
        return 1

    try:
        import onnx  # noqa: F401 — required by torch.onnx.export (PyTorch 2.x)
    except ImportError:
        print("Install the onnx package: pip install onnx", file=sys.stderr)
        print("Or: pip install -r scripts/requirements-export-onnx.txt", file=sys.stderr)
        return 1

    if not os.path.isfile(PT_PATH):
        print(f"Missing model file: {PT_PATH}", file=sys.stderr)
        return 1

    print(f"Loading TorchScript: {PT_PATH}")
    model = torch.jit.load(PT_PATH, map_location="cpu")
    model.eval()

    dummy = torch.randn(1, 3, INPUT_SIZE, INPUT_SIZE)

    # Probe forward (helps catch shape errors before export)
    with torch.no_grad():
        out = model(dummy)
    print(f"OK forward pass, output shape: {tuple(out.shape) if hasattr(out, 'shape') else type(out)}")

    print(f"Exporting ONNX -> {ONNX_OUT}")
    torch.onnx.export(
        model,
        dummy,
        ONNX_OUT,
        input_names=["input"],
        output_names=["output"],
        opset_version=17,
        dynamo=False,
    )

    print("Done.")
    print()
    print("Next: copy ONNX to the Metro asset name used by the app:")
    print(f"  {ONNX_OUT}")
    print(f"  -> {MP4_ALIAS}")
    shutil.copyfile(ONNX_OUT, MP4_ALIAS)
    print(f"Copied to {MP4_ALIAS} (overwrite if you already had an older export).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
