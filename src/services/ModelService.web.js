/**
 * Web ModelService. Uses plain @tensorflow/tfjs (browser) so you can test
 * real model integration in the app without Expo Go or an APK.
 * If the backend serves the TF.js model at /public/models/tfjs/model.json,
 * real inference runs; otherwise falls back to mock.
 */

import * as tf from '@tensorflow/tfjs';

const BACKEND_ORIGIN = 'https://maizeguard-backend.onrender.com';
const MODEL_URL = `${BACKEND_ORIGIN}/public/models/tfjs/model.json`;
const INPUT_SIZE = 224;

class ModelService {
  constructor() {
    this.isReady = false;
    this.modelUri = null;
    this.tfjsModel = null;
  }

  async init() {
    try {
      this.tfjsModel = await tf.loadLayersModel(MODEL_URL);
      this.isReady = true;
      console.log('ModelService (web): real TF.js model loaded from backend.');
    } catch (e) {
      console.warn('ModelService (web): model not available, using mock.', e?.message);
      this.isReady = true;
    }
  }

  async predict(imageUri) {
    if (!this.isReady) {
      return this._mock();
    }
    if (this.tfjsModel) {
      try {
        return await this._runInference(imageUri);
      } catch (e) {
        console.warn('Web inference failed, using mock:', e?.message);
      }
    }
    return this._mock();
  }

  async _runInference(imageUri) {
    const img = await this._loadImage(imageUri);
    const canvas = document.createElement('canvas');
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);

    let tensor = null;
    let normalized = null;
    try {
      tensor = tf.browser.fromPixels(canvas);
      normalized = tensor.toFloat().div(255).expandDims(0);
      tensor.dispose();

      const output = this.tfjsModel.predict(normalized);
      const pred = await output.data();
      normalized.dispose();
      output.dispose();

      const healthy = pred[0];
      const msv = pred[1];
      const confident = Math.max(healthy, msv) > 0.85;
      const ambiguous = Math.abs(msv - healthy) < 0.2;

      if (!confident || ambiguous) {
        return { isInvalid: true, isInfected: false, confidence: Math.max(healthy, msv) };
      }
      return {
        isInvalid: false,
        isInfected: msv > 0.5,
        confidence: Math.max(healthy, msv),
      };
    } finally {
      if (tensor && !tensor.isDisposed) tensor.dispose();
      if (normalized && !normalized.isDisposed) normalized.dispose();
    }
  }

  _loadImage(uri) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = uri;
    });
  }

  _mock() {
    const isInfected = Math.random() > 0.5;
    const confidence = Number((Math.random() * (0.95 - 0.82) + 0.82).toFixed(2));
    return { isInfected, confidence, isInvalid: false };
  }

  async updateModel() {
    return false;
  }
}

export default new ModelService();
