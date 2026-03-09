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
      console.log('Initializing ModelService (TF.js on-device + optional TFLite bundle)...');
      await this.ensureDirectoryExists();

      // 1. Prepare TF.js backend (required before any tf.* call)
      try {
        await tf.ready();
        this.tfReady = true;
        console.log('TensorFlow.js backend ready.');
      } catch (e) {
        console.warn('TF.js backend not available (use dev build for full support):', e?.message);
      }

      // 2. Try to load TF.js model from backend (static files; no inference on server)
      if (this.tfReady) {
        const backendOrigin = this._getBackendOrigin();
        const tfjsModelUrl = `${backendOrigin}/public/models/tfjs/model.json`;
        try {
          this.tfjsModel = await tf.loadLayersModel(tfjsModelUrl);
          console.log('TF.js model loaded from backend (on-device inference).');
        } catch (e) {
          console.warn('TF.js model not available (serve model from backend/public/models/tfjs/):', e?.message);
        }
      }

      // 3. TFLite path kept for future native TFLite or model-download UI
      const hasUpdate = await this.checkModelExists();
      if (hasUpdate) {
        this.modelUri = LOCAL_MODEL_PATH;
      } else {
        try {
          const asset = Asset.fromModule(require('../../assets/model.tflite.mp4'));
          await asset.downloadAsync();
          this.modelUri = asset.localUri;
        } catch (_) {}
      }

      this.isReady = true;
      this.checkForUpdates();
    } catch (e) {
      console.log('Model initialization failed:', e?.message);
      this.isReady = false;
    }
  }

  _getBackendOrigin() {
    try {
      const { API_URL } = require('../api/client');
      return (API_URL || '').replace(/\/api\/?$/, '') || DEFAULT_BACKEND_ORIGIN;
    } catch (_) {
      return DEFAULT_BACKEND_ORIGIN;
    }
  }

  async checkForUpdates() {
    try {
      await this.downloadModel();
    } catch (e) {
      console.log('No TFLite update available or offline:', e?.message);
    }
  }

  async ensureDirectoryExists() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(LOCAL_MODEL_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(LOCAL_MODEL_DIR, { intermediates: true });
      }
    } catch (e) {
      try {
        await FileSystem.makeDirectoryAsync(LOCAL_MODEL_DIR, { intermediates: true });
      } catch (_) {}
    }
  }

  async checkModelExists() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LOCAL_MODEL_PATH);
      return fileInfo.exists && fileInfo.size > 0;
    } catch (e) {
      return false;
    }
  }

  async downloadModel() {
    try {
      const downloadRes = await FileSystem.downloadAsync(MODEL_URL_TFLITE, LOCAL_MODEL_PATH);
      if (downloadRes.status !== 200) {
        await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
        throw new Error(`Status: ${downloadRes.status}`);
      }
    } catch (e) {
      await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
      throw e;
    }
  }

  /**
   * Run on-device inference with TF.js, or fall back to dev mock.
   * Returns { isInfected, confidence, isInvalid? }.
   */
  async predict(imageUri) {
    if (!this.isReady) {
      return this._getDevMockResult();
    }

    if (this.tfjsModel) {
      try {
        return await this._runTfjsInference(imageUri);
      } catch (e) {
        console.warn('TF.js inference failed, using fallback:', e?.message);
      }
    }

    return this._getDevMockResult();
  }

  async _runTfjsInference(imageUri) {
    let imageTensor = null;
    let resized = null;
    let normalized = null;

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const raw = base64ToUint8Array(base64);
      if (typeof tf.decodeImage === 'function') {
        imageTensor = tf.decodeImage(raw, 3);
      } else {
        const { decodeJpeg } = require('@tensorflow/tfjs-react-native');
        imageTensor = decodeJpeg(raw, 3);
      }
      if (!imageTensor || imageTensor.shape.length !== 3) {
        throw new Error('Unexpected image tensor shape');
      }
      const [h, w] = imageTensor.shape.slice(0, 2);
      resized = tf.image.resizeBilinear(imageTensor, [INPUT_SIZE, INPUT_SIZE]);
      imageTensor.dispose();
      imageTensor = null;
      normalized = resized.toFloat().div(255.0).expandDims(0);
      resized.dispose();
      resized = null;

      const output = this.tfjsModel.predict(normalized);
      const predictions = await output.data();
      normalized.dispose();
      output.dispose();

      const healthyConfidence = predictions[0];
      const msvConfidence = predictions[1];
      const isVerySure = Math.max(msvConfidence, healthyConfidence) > 0.85;
      const isAmbiguous = Math.abs(msvConfidence - healthyConfidence) < 0.2;

      if (!isVerySure || isAmbiguous) {
        return {
          isInvalid: true,
          isInfected: false,
          confidence: Math.max(msvConfidence, healthyConfidence),
        };
      }

      return {
        isInvalid: false,
        isInfected: msvConfidence > 0.5,
        confidence: Math.max(msvConfidence, healthyConfidence),
      };
    } finally {
      if (imageTensor) imageTensor.dispose();
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
