/**
 * Web-only ModelService. No TF.js or react-native-fs — keeps the web bundle from pulling
 * in native-only deps and fixes "Unable to resolve react-native-fs".
 * Uses mock prediction so the app runs; real inference is on native (Expo Go / dev build).
 */

class ModelService {
  constructor() {
    this.isReady = false;
    this.modelUri = null;
  }

  async init() {
    this.isReady = true;
  }

  async predict() {
    const isInfected = Math.random() > 0.5;
    const confidence = Number((Math.random() * (0.95 - 0.82) + 0.82).toFixed(2));
    return { isInfected, confidence, isInvalid: false };
  }

  async updateModel() {
    return false;
  }
}

export default new ModelService();
