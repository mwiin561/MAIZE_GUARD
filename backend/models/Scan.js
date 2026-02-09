const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  localId: { type: String, required: true }, // For tracking offline records
  
  // 1. Location & Time (Automatic)
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number, // in meters
  },
  timestamp: { type: Date, default: Date.now },

  // 2. Image Capture Metadata (Automatic)
  imageMetadata: {
    resolution: String, // e.g., "1920x1080"
    orientation: String, // "portrait", "landscape"
    flashUsed: Boolean,
    qualityFlag: {
      type: String,
      enum: ['Good', 'Blurry', 'Poor Lighting', 'Unknown'],
      default: 'Unknown'
    }
  },

  // 3. Crop Growth Context (User-Selected)
  growthStage: {
    type: String,
    enum: ['Seedling', 'Vegetative', 'Reproductive', 'Unknown'],
    default: 'Unknown'
  },
  plantAge: String, // Optional range

  // 4. Disease Assessment (Model + User)
  diagnosis: {
    modelPrediction: String, // e.g., "Gray Leaf Spot"
    confidence: Number, // 0.0 to 1.0
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Unknown'],
      default: 'Unknown'
    },
    userVerified: { type: Boolean, default: false }, // Did user confirm?
    finalDiagnosis: String // In case user overrides model
  },

  // 5. Field & Environment Indicators (User Taps)
  environment: {
    weather: {
      type: String,
      enum: ['Sunny', 'Cloudy', 'Rainy', 'Unknown'],
      default: 'Unknown'
    },
    weedPresence: {
      type: String,
      enum: ['Yes', 'No', 'Not Sure'],
      default: 'Not Sure'
    },
    // Maize Streak Virus Vector
    leafhopperObserved: {
      type: String,
      enum: ['Yes', 'No', 'Not Sure'],
      default: 'Not Sure'
    }
  },

  // 6. App Usage (Automatic)
  appUsage: {
    retries: { type: Number, default: 0 },
    timeSpentSeconds: Number,
    resultAccepted: Boolean
  },

  // 7. Offline Storage & Sync Metadata (Automatic)
  deviceInfo: {
    model: String,
    osVersion: String
  },
  syncedAt: Date, // Server time when received
  imageUrl: String // Path to image in cloud storage (S3/Cloudinary)
});

module.exports = mongoose.model('Scan', ScanSchema);
