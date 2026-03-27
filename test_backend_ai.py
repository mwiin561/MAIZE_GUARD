
import requests
import base64
import os

def test_predict(image_path):
    url = "http://localhost:5001/predict"
    with open(image_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode("utf-8")
        json_data = {"imageData": f"data:image/jpeg;base64,{img_data}"}
    
    try:
        response = requests.post(url, json=json_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test with a known maize image if available, else just a dummy check
    test_image = "assets/hero-banner.jpg" # This is a maize field image
    if os.path.exists(test_image):
        test_predict(test_image)
    else:
        print("Test image not found.")
