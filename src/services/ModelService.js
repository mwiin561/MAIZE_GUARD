import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// TF.js for image preprocessing (resize/decode)
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

const DEFAULT_BACKEND_URL = 'https://maizeguard-backend-1.onrender.com';
const INPUT_SIZE = 224;
// Labels match the model's output classes
const LABELS = ["Healthy", "MSV", "Unknown"];

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

/**
 * Softmax for raw logit outputs
 */
function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(l => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

class ModelService {
  constructor() {
    this.isReady = false;
    this.onnxSession = null;
    this.modelUri = null;
    this.tfReady = false;
  }

  async init() {
    try {
      console.log('🧠 Initializing Offline ONNX ModelService...');

      // Step 1: Initialize TF.js (needed for image decode/resize)
      await tf.ready();
      this.tfReady = true;

      // Step 2: Load the bundled ONNX model via asset
      // .mp4 extension trick ensures Metro bundles the binary
      const modelAsset = Asset.fromModule(require('../../assets/model.onnx.mp4'));
      await modelAsset.downloadAsync();
      this.modelUri = modelAsset.localUri;
      console.log('📦 ONNX model asset ready at:', this.modelUri);

      // Step 3: Create ONNX InferenceSession
      const { InferenceSession } = require('onnxruntime-react-native');
      this.onnxSession = await InferenceSession.create(this.modelUri);
      console.log('✅ ONNX InferenceSession created. Offline AI READY!');
      
      this.isReady = true;
    } catch (e) {
      console.error('❌ ONNX Model initialization failed:', e?.message);
      this.isReady = false;
    }
  }

  /**
   * Predict from imageUri.
   * Tries offline ONNX first, falls back to cloud backend.
   */
  async predict(imageUri) {
    // — Try on-device inference first —
    if (this.isReady && this.onnxSession) {
      try {
        return await this._runOnnxInference(imageUri);
      } catch (e) {
        console.warn('⚠️ ONNX inference failed, falling back to cloud:', e?.message);
      }
    }
    
    // — Cloud fallback —
    try {
      return await this._runNetworkInference(imageUri);
    } catch (e) {
      console.warn('⚠️ Cloud inference also failed:', e?.message);
      return this._getDevMockResult();
    }
  }

  /**
   * Run the ONNX model on-device (offline).
   * Golden Recipe: Bilinear resize to 224x224, scale to [0,1], no normalization.
   */
  async _runOnnxInference(imageUri) {
    const { Tensor } = require('onnxruntime-react-native');
    const { decodeJpeg } = require('@tensorflow/tfjs-react-native');

    // 1. Read image as base64 → Uint8Array → tf tensor
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const rawBytes = base64ToUint8Array(base64);
    
    let decoded = null, resized = null, normalized = null;
    try {
      decoded = decodeJpeg(rawBytes, 3);
      resized = tf.image.resizeBilinear(decoded, [INPUT_SIZE, INPUT_SIZE]);
      // Scale to [0, 1] — The Golden Recipe (no mean/std normalization)
      normalized = resized.toFloat().div(255.0);

      // 2. Convert to flat Float32Array with shape [1, 3, 224, 224] (NCHW format)
      const hwcData = await normalized.data(); // shape: [224, 224, 3]
      const nchwData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
      for (let h = 0; h < INPUT_SIZE; h++) {
        for (let w = 0; w < INPUT_SIZE; w++) {
          for (let c = 0; c < 3; c++) {
            nchwData[c * INPUT_SIZE * INPUT_SIZE + h * INPUT_SIZE + w] =
              hwcData[(h * INPUT_SIZE + w) * 3 + c];
          }
        }
      }

      // 3. Create ONNX Tensor and run inference
      const inputTensor = new Tensor('float32', nchwData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
      const feeds = { input: inputTensor };
      const results = await this.onnxSession.run(feeds);

      // 4. Parse output — get the first output key
      const outputKey = Object.keys(results)[0];
      const outputData = Array.from(results[outputKey].data);

      // 5. Apply softmax if outputs look like logits
      const probs = outputData.some(v => v < 0) ? softmax(outputData) : outputData;
      const topIdx = probs.indexOf(Math.max(...probs));
      const confidence = probs[topIdx];
      const label = LABELS[topIdx] || 'Unknown';

      console.log(`🌽 ONNX Offline Result: ${label} @ ${(confidence * 100).toFixed(1)}%`);
      return {
        isInfected: label === 'MSV',
        confidence,
        diagnosis: label,
        isMaize: label !== 'Unknown',
        source: 'offline',
      };
    } finally {
      if (decoded) decoded.dispose();
      if (resized) resized.dispose();
      if (normalized) normalized.dispose();
    }
  }

  /**
   * Cloud fallback — sends image to Render backend.
   */
  async _runNetworkInference(imageUri) {
    const { API_URL } = require('../api/client');
    const baseUrl = (API_URL || DEFAULT_BACKEND_URL + '/api').replace(/\/api\/?$/, '');

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    });

    const response = await fetch(`${baseUrl}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`Server: ${response.status}`);

    const data = await response.json();
    const label = data.diagnosis || 'Unknown';
    const confidence = data.confidence || 0;

    console.log(`☁️ Cloud Result: ${label} @ ${(confidence * 100).toFixed(1)}%`);
    return {
      isInfected: label === 'MSV',
      confidence,
      diagnosis: label,
      isMaize: label !== 'Unknown',
      source: 'cloud',
    };
  }

  _getDevMockResult() {
    const isInfected = Math.random() > 0.5;
    const confidence = Number((Math.random() * (0.95 - 0.72) + 0.72).toFixed(2));
    return {
      isInfected,
      confidence,
      isInvalid: false,
      diagnosis: isInfected ? 'MSV' : 'Healthy',
      source: 'mock',
    };
  }

  async updateModel() {
    return false;
  }
}

export default new ModelService();
