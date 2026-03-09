const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

// Option B: Backend runs the real model (v2 TFLite when available, else TF.js on e.g. Render)
let tfliteModel = null;
let tfjsModel = null;
let tf = null;

const loadTFLite = () => {
  try {
    const tflite = require('tflite-node');
    const modelPath = path.join(__dirname, '..', 'public', 'models', 'v2', 'model.tflite');
    if (fs.existsSync(modelPath)) {
      tfliteModel = new tflite.TFLiteModel(modelPath);
      console.log('AI Model (v2 TFLite) loaded with tflite-node');
    } else {
      console.warn('TFLite model not found at:', modelPath);
    }
  } catch (err) {
    console.warn('TFLite unavailable (e.g. on Render):', err.message);
  }
};
loadTFLite();

const loadTFjs = async () => {
  if (tfjsModel) return;
  try {
    tf = require('@tensorflow/tfjs-node');
    const tfjsDir = path.join(__dirname, '..', 'public', 'models', 'tfjs');
    const modelUrl = `file://${tfjsDir.replace(/\\/g, '/')}/model.json`;
    tfjsModel = await tf.loadLayersModel(modelUrl);
    console.log('AI Model (TF.js fallback) loaded from public/models/tfjs');
  } catch (err) {
    console.warn('TF.js model fallback unavailable:', err.message);
  }
};
loadTFjs();

function parsePredictions(predictions) {
  if (!predictions || predictions.length < 2) return null;
  const healthyConfidence = Number(predictions[0]);
  const msvConfidence = Number(predictions[1]);
  const isVerySure = Math.max(msvConfidence, healthyConfidence) > 0.85;
  const isAmbiguous = Math.abs(msvConfidence - healthyConfidence) < 0.2;
  if (!isVerySure || isAmbiguous) {
    return {
      isInvalid: true,
      diagnosis: 'Uncertain',
      confidence: Math.max(msvConfidence, healthyConfidence),
      raw: Array.from(predictions)
    };
  }
  return {
    isInvalid: false,
    isInfected: msvConfidence > 0.5,
    confidence: Math.max(msvConfidence, healthyConfidence),
    diagnosis: msvConfidence > 0.5 ? 'Maize Streak Virus' : 'Healthy',
    raw: Array.from(predictions)
  };
}

const runInference = async (imagePath) => {
  if (tfliteModel == null && tfjsModel == null) await loadTFjs();
  const hasTFLite = tfliteModel != null;
  const hasTFjs = tfjsModel != null;
  if (!hasTFLite && !hasTFjs) return null;

  try {
    const image = await Jimp.read(imagePath);
    image.resize(224, 224);
    const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

    if (!tf) tf = require('@tensorflow/tfjs-node');
    const input = tf.node.decodeImage(imageBuffer, 3);
    const normalized = input.toFloat().div(255.0).expandDims(0);

    let predictions;
    if (tfliteModel) {
      try {
        const output = tfliteModel.predict(normalized);
        predictions = Array.isArray(output) ? output : (await output.data ? output.data() : Array.from(output));
      } catch (e) {
        if (tfjsModel) {
          const out = tfjsModel.predict(normalized);
          predictions = await out.data();
          if (out.dispose) out.dispose();
        } else throw e;
      }
    } else {
      const output = tfjsModel.predict(normalized);
      predictions = await output.data();
      output.dispose();
    }
    input.dispose();
    normalized.dispose();

    return parsePredictions(predictions);
  } catch (err) {
    console.error('Inference error:', err);
    return null;
  }
};

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // filename: scan-{timestamp}-{originalName}
    cb(null, 'scan-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST api/scans/upload-image
// @desc    Upload an image
// @access  Public (for now, or Private)
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  const aiResult = await runInference(req.file.path);

  res.json({
    imageUrl: `/public/uploads/${req.file.filename}`,
    aiResult: aiResult
  });
});

router.post('/upload-image-web', async (req, res) => {
  try {
    const body = req.body || {};
    const imageData = body.imageData;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ msg: 'No image data provided.' });
    }

    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ msg: 'Invalid image data.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let extension = '.jpg';
    if (mimeType === 'image/png') {
      extension = '.png';
    } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      extension = '.jpg';
    }

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = 'scan-' + Date.now() + extension;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const aiResult = await runInference(filePath);

    res.json({
      imageUrl: `/public/uploads/${filename}`,
      aiResult: aiResult
    });
  } catch (err) {
    console.error('upload-image-web error:', err);
    res.status(500).json({ msg: 'Server error while saving image.' });
  }
});

// @route   POST api/scans/sync
// @desc    Sync offline scans to the cloud
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    // Expecting an array of scan objects
    const scans = req.body;
    
    if (!Array.isArray(scans)) {
      return res.status(400).json({ msg: 'Data must be an array of scans' });
    }

    const savedScans = [];
    const errors = [];

    // Process each scan
    for (const scanData of scans) {
      try {
        // Check if this localId already exists for this user to avoid duplicates
        // Assuming we have user info from auth middleware (req.user.id)
        // For MVP, we'll just save it. In prod, use updateOne with upsert: true
        
        const newScan = new Scan({
          ...scanData,
          user: req.user ? req.user.id : null, // Link to user if auth exists
          syncedAt: new Date()
        });

        await newScan.save();
        savedScans.push(newScan.localId);
      } catch (err) {
        console.error('Error saving scan:', err);
        errors.push({ localId: scanData.localId, error: err.message });
      }
    }

    res.json({
      msg: 'Sync complete',
      syncedCount: savedScans.length,
      savedIds: savedScans,
      errors: errors
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/scans
// @desc    Get all scans for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user.id }).sort({ timestamp: -1 });
    res.json(scans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/scans
// @desc    Create a single scan record
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const scanData = req.body;
    
    const newScan = new Scan({
      ...scanData,
      user: req.user.id,
      syncedAt: new Date()
    });

    const scan = await newScan.save();
    res.json(scan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
