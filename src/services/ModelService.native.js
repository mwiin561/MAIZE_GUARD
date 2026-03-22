/**
 * On-device diagnosis (offline) using ONNX Runtime + TF.js for preprocessing.
 * Requires a development build (expo-dev-client / EAS build). Expo Go may not load native ML libs — init falls back gracefully.
 *
 * Asset: assets/model.onnx.mp4 — ONNX exported from assets/model_torchscript.pt
 * (run: python scripts/export_torchscript_to_onnx.py)
 */
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const INPUT_SIZE = 224;
/** Reject near-black frames (camera covered) — aligned with Python TFLite service idea */
const MIN_MEAN_BRIGHTNESS = 0.08;

const LABELS_2 = ['Healthy', 'MSV'];
const LABELS_3 = ['Healthy', 'MSV', 'Unknown'];

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

class ModelService {
  constructor() {
    this.isReady = false;
    this.onnxSession = null;
    this.modelUri = null;
    this.tfReady = false;
    this._inputName = 'input';
  }

  async init() {
    try {
      const tf = require('@tensorflow/tfjs');
      require('@tensorflow/tfjs-react-native');
      await tf.ready();
      this.tfReady = true;

      const modelAsset = Asset.fromModule(require('../../assets/model.onnx.mp4'));
      await modelAsset.downloadAsync();
      this.modelUri = modelAsset.localUri;

      const { InferenceSession } = require('onnxruntime-react-native');
      this.onnxSession = await InferenceSession.create(this.modelUri);

      const names =
        this.onnxSession.inputNames ||
        (this.onnxSession.handler && this.onnxSession.handler.inputNames);
      if (Array.isArray(names) && names.length > 0) {
        this._inputName = names[0];
      }

      this.isReady = true;
      console.log('✅ Offline ONNX ready (input:', this._inputName + ')');
    } catch (e) {
      console.warn(
        '⚠️ Offline ML unavailable (Expo Go or missing native build):',
        e?.message || e
      );
      this.isReady = false;
    }
  }

  /**
   * Offline-first: run ONNX on device, then optional dev Flask server, then mock.
   */
  async predict(imageUri) {
    if (this.isReady && this.onnxSession) {
      try {
        return await this._runOnnxInference(imageUri);
      } catch (e) {
        console.warn('⚠️ ONNX inference failed:', e?.message);
      }
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      try {
        return await this._runFlaskInference(imageUri);
      } catch (e) {
        console.warn('⚠️ Dev Flask backend skipped:', e?.message);
      }
      console.warn('⚠️ Using random mock diagnosis (__DEV__ only)');
      return this._getDevMockResult();
    }

    // Production: no ONNX / no dev server — let caller try cloud or show error
    return null;
  }

  async _runOnnxInference(imageUri) {
    const tf = require('@tensorflow/tfjs');
    const { decodeJpeg } = require('@tensorflow/tfjs-react-native');
    const { Tensor } = require('onnxruntime-react-native');

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const rawBytes = base64ToUint8Array(base64);

    let decoded = null;
    let resized = null;
    let normalized = null;

    try {
      decoded = decodeJpeg(rawBytes, 3);
      resized = tf.image.resizeBilinear(decoded, [INPUT_SIZE, INPUT_SIZE]);
      normalized = resized.toFloat().div(255.0);

      const meanTensor = normalized.mean();
      const meanVal = (await meanTensor.data())[0];
      meanTensor.dispose();
      if (meanVal < MIN_MEAN_BRIGHTNESS) {
        return {
          isInvalid: true,
          diagnosis: 'Invalid Image',
          confidence: 0,
          isMaize: false,
          source: 'offline',
        };
      }

      const hwcData = await normalized.data();
      const nchwData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
      for (let h = 0; h < INPUT_SIZE; h++) {
        for (let w = 0; w < INPUT_SIZE; w++) {
          for (let c = 0; c < 3; c++) {
            nchwData[c * INPUT_SIZE * INPUT_SIZE + h * INPUT_SIZE + w] =
              hwcData[(h * INPUT_SIZE + w) * 3 + c];
          }
        }
      }

      const inputTensor = new Tensor('float32', nchwData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
      const feeds = { [this._inputName]: inputTensor };
      const results = await this.onnxSession.run(feeds);

      const outputKey = Object.keys(results)[0];
      const outputData = Array.from(results[outputKey].data);

      const probs = outputData.some((v) => v < 0 || v > 1.01)
        ? softmax(outputData)
        : outputData;
      const topIdx = probs.indexOf(Math.max(...probs));
      const confidence = probs[topIdx];

      let diagnosis;
      if (outputData.length === 2) {
        diagnosis = LABELS_2[topIdx] ?? 'Unknown';
      } else if (outputData.length >= 3) {
        diagnosis = LABELS_3[topIdx] ?? 'Unknown';
      } else {
        diagnosis = topIdx === 0 ? 'Healthy' : 'MSV';
      }

      const uncertain =
        diagnosis === 'Unknown' || (outputData.length === 2 && confidence < 0.55);

      // Don't set isMaize: false when we're "uncertain" — that wrongly triggers "Not a Maize Leaf" UI.
      // Only set isMaize when we're sure (undefined = unknown / use Uncertain Scan copy instead).
      const isMaize =
        uncertain ? undefined : diagnosis !== 'Unknown';

      return {
        isInfected: diagnosis === 'MSV',
        confidence,
        diagnosis: uncertain ? 'Uncertain Scan' : diagnosis,
        isMaize,
        isInvalid: false,
        isHealthy: diagnosis === 'Healthy',
        source: 'offline',
      };
    } finally {
      if (decoded) decoded.dispose();
      if (resized) resized.dispose();
      if (normalized) normalized.dispose();
    }
  }

  async _runFlaskInference(imageUri) {
    const { MODEL_SERVICE_URL } = require('../api/client');
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    });
    const response = await fetch(`${MODEL_SERVICE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Flask ${response.status}`);
    const data = await response.json();
    const label = data.diagnosis || data.raw_class || 'Unknown';
    const confidence = data.confidence ?? 0;
    return {
      isInfected: data.isInfected || label === 'MSV',
      confidence,
      diagnosis: label,
      isMaize: data.isMaize !== false,
      isHealthy: label === 'Healthy',
      source: 'flask-backend',
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
