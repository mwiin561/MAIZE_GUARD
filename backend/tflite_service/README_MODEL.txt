Model deployment notes

Model file:
- model_torchscript.pt

Classes:
- Healthy
- MSV
- Unknown

Expected input:
- RGB image
- resized to 224 x 224

Preprocessing:
- Resize to 224x224 using bilinear interpolation
- Convert to tensor
- No normalization

Inference rules:
- Apply softmax to model output
- Pick the class with highest probability
- If predicted class is "Unknown", return "Unknown"
- If confidence is below 0.70, return "Uncertain"
- Otherwise return the predicted class

Recommended Raspberry Pi flow:
1. Capture image from camera
2. Convert to RGB
3. Resize to 224x224
4. Convert to tensor
5. Run TorchScript model
6. Apply softmax
7. Return label and confidence
