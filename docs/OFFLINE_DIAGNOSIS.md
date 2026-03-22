# Offline on-device diagnosis

## Your trained model file (`model_torchscript.pt`)

The project keeps the PyTorch **TorchScript** export as **`assets/model_torchscript.pt`**.

The **mobile app does not run `.pt` files directly** — it uses **ONNX Runtime**. You must **convert** TorchScript → ONNX whenever you update the weights:

```bash
pip install -r scripts/requirements-export-onnx.txt
python scripts/export_torchscript_to_onnx.py
```

(The exporter needs both **`torch`** and **`onnx`** — if you see `Module onnx is not installed`, run the `pip install` line above.)

That script writes **`assets/model.onnx`** and copies it to **`assets/model.onnx.mp4`** (fake extension so Metro bundles the binary).

If export fails (wrong input size, custom inputs), edit `scripts/export_torchscript_to_onnx.py` (`INPUT_SIZE`, `dummy` shape, or `input_names`) to match your model.

## How it works

1. **`ModelService.native.js`** loads **`assets/model.onnx.mp4`** (ONNX exported from `model_torchscript.pt`) and runs inference with **ONNX Runtime** + **TensorFlow.js** (decode/resize only).
2. **`DiagnosisScreen`** calls **`ModelService.predict(image)` first**, then tries **upload** for sync/history only. The diagnosis shown to the user is **offline-first**.
3. **Dark / covered camera** frames are rejected locally (mean brightness check), similar to the Python TFLite service idea.

## Dependencies

- **`react-native-fs`** — required by `@tensorflow/tfjs-react-native` at bundle time (Metro resolves `bundle_resource_io.js`). Without it, **EAS “Bundle JavaScript”** fails. Installed via `npx expo install react-native-fs`.

## Requirements

| Environment | Offline AI |
|-------------|------------|
| **EAS / dev client** (`expo-dev-client`) | ✅ ONNX native modules are included |
| **Expo Go** | ⚠️ Native ML may not initialize — use a **development build** for real offline tests |

Run: `npx expo run:android` or `eas build` with your dev/prod profile.

## Model outputs

- ONNX output: **2 classes** (`Healthy`, `MSV`) or **3 classes** (with `Unknown`) — `ModelService.native.js` maps indices accordingly.

## Production behaviour

- If ONNX **does not** load (e.g. misconfigured build), `predict()` returns **`null`** and the app may use **server** AI when online, or the **mock** only in **`__DEV__`**.
