import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// TF.js on-device inference (native only). Web uses ModelService.web.js to avoid pulling in react-native-fs.
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

const SERVER_URL = Platform.OS === 'web' ? 'http://localhost:5002' : 'http://10.0.2.2:5002';
const MODEL_URL_TFLITE = `${SERVER_URL}/public/models/v1/model.tflite`;
const DEFAULT_BACKEND_ORIGIN = 'https://maizeguard-backend.onrender.com';
const LOCAL_MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const LOCAL_MODEL_PATH = `${LOCAL_MODEL_DIR}model.tflite`;

const INPUT_SIZE = 224;
const NUM_CLASSES = 2; // 0 = Healthy, 1 = Maize Streak Virus

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

class ModelService {
  constructor() {
    this.isReady = false;
    this.modelUri = null;
    this.tfjsModel = null;
    this.tfReady = false;
  }

  async init() {
    try {
      console.log('Initializing ModelService (Offline Mode)...');
      
      // 1. Prepare TF.js
      await tf.ready();
      this.tfReady = true;

      // 2. Load the bundled TFLite model
      // We use the .mp4 extension hack to ensure Metro bundles the large binary
      const modelAsset = Asset.fromModule(require('../../assets/model.tflite.mp4'));
      await modelAsset.downloadAsync();
      this.modelUri = modelAsset.localUri;
      
      // Load TFLite engine
      const tflite = require('@tensorflow/tfjs-tflite');
      this.tfjsModel = await tflite.loadTFLiteModel(this.modelUri);
      
      console.log('On-device TFLite model ready at:', this.modelUri);
      this.isReady = true;
    } catch (e) {
      console.error('Model initialization failed:', e?.message);
      this.isReady = false;
    }
  }

  // ... (keeping other methods as is) ...

  async _runInference(imageUri) {
    // This is the "Golden Recipe" implemented in JS:
    // 1. Load Image
    // 2. Resize Bilinear to 224x224
    // 3. No Normalization ([0, 1] scaling only)
    
    let decoded = null;
    let resized = null;
    let normalized = null;

    try {
      const { decodeJpeg } = require('@tensorflow/tfjs-react-native');
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      const raw = base64ToUint8Array(base64);
      
      decoded = decodeJpeg(raw, 3);
      resized = tf.image.resizeBilinear(decoded, [INPUT_SIZE, INPUT_SIZE]);
      
      // Scaling [0, 1] - No mean/std normalization (The "Golden Recipe")
      normalized = resized.toFloat().div(255.0).expandDims(0);

      const predictionsTensor = this.tfjsModel.predict(normalized);
      const predictions = await predictionsTensor.data();
      predictionsTensor.dispose();

      const topIdx = predictions.indexOf(Math.max(...predictions));
      const confidence = predictions[topIdx];
      
      // Updated for 3 classes: [Healthy, MSV, Unknown]
      const labels = ["Healthy", "MSV", "Unknown"];
      const label = labels[topIdx] || "Unknown";

      console.log(`Inference Result: ${label} (${(confidence * 100).toFixed(1)}%)`);

      return {
        isInfected: label === 'MSV',
        confidence: confidence,
        diagnosis: label,
        isMaize: label !== 'Unknown'
      };
    } finally {
      if (decoded) decoded.dispose();
      if (resized) resized.dispose();
      if (normalized) normalized.dispose();
    }
  }

  _getDevMockResult() {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const isInfected = Math.random() > 0.5;
      const confidence = Number((Math.random() * (0.95 - 0.82) + 0.82).toFixed(2));
      return { isInfected, confidence, isInvalid: false };
    }
    return null;
  }

  async updateModel() {
    try {
      await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
      await this.downloadModel();
      this.modelUri = LOCAL_MODEL_PATH;
      return true;
    } catch (e) {
      console.log('Failed to update model:', e?.message);
      return false;
    }
  }
}

export default new ModelService();
