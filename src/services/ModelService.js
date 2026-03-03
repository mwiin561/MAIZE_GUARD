import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

// Match the IP used in client.js
const SERVER_URL = Platform.OS === 'web' 
  ? 'http://localhost:5001' 
  : 'http://10.0.2.2:5001'; 
const MODEL_URL = `${SERVER_URL}/public/models/v1/model.tflite`;
const LOCAL_MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const LOCAL_MODEL_PATH = `${LOCAL_MODEL_DIR}model.tflite`;

class ModelService {
  constructor() {
    this.isReady = false;
    this.modelUri = null;
  }

  async init() {
    try {
      console.log('Initializing ModelService (Hybrid Mode)...');
      await this.ensureDirectoryExists();

      // 1. Check for downloaded update first
      const hasUpdate = await this.checkModelExists();
      
      if (hasUpdate) {
        console.log('Using downloaded update model at:', LOCAL_MODEL_PATH);
        this.modelUri = LOCAL_MODEL_PATH;
      } else {
        // 2. Fallback to Bundled Asset
        console.log('Using bundled model (v1)...');
        // Hack: Append .mp4 to bypass Metro config issues with .tflite (and .png image-size check)
        const asset = Asset.fromModule(require('../../assets/model.tflite.mp4'));
        await asset.downloadAsync(); // Ensures it's available in cache
        this.modelUri = asset.localUri;
        console.log('Bundled model ready at:', this.modelUri);
      }
      
      this.isReady = true;
      
      // 3. Background: Check for updates silently
      this.checkForUpdates(); 

    } catch (e) {
      console.log('Model initialization failed:', e.message);
      this.isReady = false;
    }
  }

  async checkForUpdates() {
    try {
        console.log('Checking for model updates...');
        // In a real app, check version API first. 
        // Here we just try to download. If server is up, we get it.
        await this.downloadModel();
        console.log('Update downloaded. Will be used on next restart.');
    } catch (e) {
        console.log('No update available or offline:', e.message);
    }
  }

  async ensureDirectoryExists() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(LOCAL_MODEL_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(LOCAL_MODEL_DIR, { intermediates: true });
      }
    } catch (e) {
      // If getInfoAsync fails because it's missing, try to create it anyway
      try {
        await FileSystem.makeDirectoryAsync(LOCAL_MODEL_DIR, { intermediates: true });
      } catch (err) {}
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
      const downloadRes = await FileSystem.downloadAsync(
        MODEL_URL,
        LOCAL_MODEL_PATH
      );
      
      if (downloadRes.status !== 200) {
        // If 404 or other error, delete the partial file
        await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
        throw new Error(`Failed to download model. Status: ${downloadRes.status}`);
      }
      
      console.log('Model downloaded successfully to:', downloadRes.uri);
    } catch (e) {
      // Clean up if failed
      await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
      throw e;
    }
  }

  // Removed loadModel() since we do the check in init()

  /**
   * Dev-only mock so you can test the full flow (camera → analyze → result) in Expo Go
   * before building an APK. Set ModelService.useMockInDev = true to use it.
   * Replace with real TFLite/TF.js inference when you add a native runtime.
   */
  async predict(imageUri) {
    if (!this.isReady) {
      console.log('Model not ready. Falling back to mock logic.');
      return this._getDevMockResult();
    }

    console.log('Predicting using model at:', this.modelUri);
    // TODO: Real inference when TFLite/TF.js runtime is added (e.g. in dev build)
    // const result = await tflite.runModelOnImage({ model: this.modelUri, path: imageUri, ... });
    // return { isInfected, confidence, isInvalid? };

    return this._getDevMockResult();
  }

  /**
   * Returns a mock result for testing in Expo Go. Only used when real inference isn't available.
   */
  _getDevMockResult() {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const isInfected = Math.random() > 0.5;
      const confidence = Number((Math.random() * (0.95 - 0.82) + 0.82).toFixed(2));
      return { isInfected, confidence, isInvalid: false };
    }
    return null;
  }
  
  // Method to force update/redownload
  async updateModel() {
      try {
          await FileSystem.deleteAsync(LOCAL_MODEL_PATH, { idempotent: true });
          await this.downloadModel();
          this.modelUri = LOCAL_MODEL_PATH;
          return true;
      } catch (e) {
          console.log('Failed to update model:', e);
          return false;
      }
  }
}

export default new ModelService();
