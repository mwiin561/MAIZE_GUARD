const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

// AI Inference is handled by Flask PyTorch service (port 5003)
// No local model loading needed - all predictions go through Flask backend

const runInference = async (imagePath) => {
  try {
    const serviceUrl = process.env.TFLITE_SERVICE_URL || 'http://localhost:5003';
    console.log(`Calling AI service at ${serviceUrl}/predict ...`);

    // We can send the file as multipart or base64. 
    // The Python service supports both. We'll use base64 for consistency.
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const response = await fetch(`${serviceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64Image })
    });

    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`);
    }

    const aiResult = await response.json();
    return aiResult;
  } catch (err) {
    console.warn('AI Inference failed (Mocking fallback):', err.message);
    // Dynamic mock based on previous logic but with a warning
    return { 
      diagnosis: 'Mock: AI Service Unreachable', 
      confidence: 0,
      isInvalid: true,
      error: err.message 
    };
  }
};

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, 'scan-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// @route   POST api/scans/upload-image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded.' });
  let aiResult = await runInference(req.file.path);
  res.json({ imageUrl: `/public/uploads/${req.file.filename}`, aiResult });
});

router.post('/upload-image-web', async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ msg: 'No image data' });

    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ msg: 'Invalid image format' });

    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `scan-${Date.now()}.jpg`;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

    await fs.promises.writeFile(filePath, buffer);
    let aiResult = await runInference(filePath);

    res.json({ imageUrl: `/public/uploads/${filename}`, aiResult });
  } catch (err) {
    res.status(500).json({ msg: 'Server error saving web image' });
  }
});

// @route   POST api/scans
router.post('/', auth, async (req, res) => {
  try {
    const s = req.body;
    const query = `
      INSERT INTO scans (
        user_id, local_id, latitude, longitude, accuracy, 
        resolution, orientation,
        model_prediction, confidence, growth_stage, plant_age,
        severity, user_verified, final_diagnosis,
        weather, weed_presence, leafhopper_observed,
        retries, time_spent_seconds, result_accepted,
        image_url, synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
      RETURNING *
    `;
    
    const params = [
      req.user.id, s.localId, s.location?.latitude, s.location?.longitude, s.location?.accuracy,
      s.imageMetadata?.resolution, s.imageMetadata?.orientation,
      s.diagnosis?.modelPrediction, s.diagnosis?.confidence, s.growthStage, s.plantAge,
      s.diagnosis?.severity, s.diagnosis?.userVerified, s.diagnosis?.finalDiagnosis,
      s.environment?.weather, s.environment?.weedPresence, s.environment?.leafhopperObserved,
      s.appUsage?.retries, s.appUsage?.timeSpentSeconds, s.appUsage?.resultAccepted,
      s.imageUrl
    ];

    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/scans/sync (SQL VERSION)
router.post('/sync', auth, async (req, res) => {
  try {
    const scans = req.body;
    if (!Array.isArray(scans)) return res.status(400).json({ msg: 'Data must be an array' });

    /** Rows actually inserted (not skipped by ON CONFLICT) */
    const insertedLocalIds = [];
    /** local_id already existed — insert skipped */
    const skippedDuplicates = [];
    const errors = [];

    for (const s of scans) {
      try {
        const query = `
          INSERT INTO scans (
            user_id, local_id, latitude, longitude, accuracy, 
            resolution, orientation,
            model_prediction, confidence, growth_stage, plant_age,
            severity, user_verified, final_diagnosis,
            weather, weed_presence, leafhopper_observed,
            retries, time_spent_seconds, result_accepted,
            image_url, synced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
          ON CONFLICT (local_id) DO NOTHING
          RETURNING local_id
        `;
        
        const params = [
          req.user.id, s.localId, s.location?.latitude, s.location?.longitude, s.location?.accuracy,
          s.imageMetadata?.resolution, s.imageMetadata?.orientation,
          s.diagnosis?.modelPrediction, s.diagnosis?.confidence, s.growthStage, s.plantAge,
          s.diagnosis?.severity, s.diagnosis?.userVerified, s.diagnosis?.finalDiagnosis,
          s.environment?.weather, s.environment?.weedPresence, s.environment?.leafhopperObserved,
          s.appUsage?.retries, s.appUsage?.timeSpentSeconds, s.appUsage?.resultAccepted,
          s.imageUrl
        ];

        const result = await db.query(query, params);
        if (result.rows.length > 0) {
          insertedLocalIds.push(String(result.rows[0].local_id));
        } else {
          skippedDuplicates.push(String(s.localId));
        }
      } catch (err) {
        console.error(`Sync error for ${s.localId}:`, err.message);
        errors.push({ localId: s.localId, error: err.message });
      }
    }

    res.json({
      msg: 'Sync complete',
      syncedCount: insertedLocalIds.length,
      insertedLocalIds,
      skippedDuplicates,
      errors,
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/scans
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scans WHERE user_id = $1 ORDER BY timestamp DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
