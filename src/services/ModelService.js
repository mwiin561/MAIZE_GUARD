import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Match the IP used in client.js
const SERVER_URL = 'http://10.0.2.2:5001'; 
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
        const asset = Asset.fromModule(require('../../assets/model.tflite'));
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
    const dirInfo = await FileSystem.getInfoAsync(LOCAL_MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LOCAL_MODEL_DIR, { intermediates: true });
    }
  }

  async checkModelExists() {
    const fileInfo = await FileSystem.getInfoAsync(LOCAL_MODEL_PATH);
    return fileInfo.exists && fileInfo.size > 0;
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
  
  async predict(imageUri) {
    if (!this.isReady) {
      console.log('Model not ready. Falling back to mock logic.');
      return null;
    }
    
    console.log('Predicting using model at:', this.modelUri);
    // Placeholder for actual inference
    // const result = await tflite.runModelOnImage({
    //   model: this.modelUri,
    //   path: imageUri,
    //   ...
    // });
    
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
