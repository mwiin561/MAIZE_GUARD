/**
 * Native (iOS/Android) ModelService for Expo Go.
 * Does not import @tensorflow/tfjs-react-native, so we never pull in react-native-fs
 * (which is not available in Expo Go). Uses mock prediction so the app runs.
 * For real TF.js inference, use a development build and the full ModelService.
 */
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

class ModelService {
  constructor() {
    this.isReady = false;
    this.modelUri = null;
  }

  async init() {
    try {
      const dir = `${FileSystem.documentDirectory}models/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      try {
        const asset = Asset.fromModule(require('../../assets/model.tflite.mp4'));
        await asset.downloadAsync();
        this.modelUri = asset.localUri;
      } catch (_) {}
      this.isReady = true;
    } catch (e) {
      console.log('ModelService (native) init:', e?.message);
      this.isReady = true;
    }
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
