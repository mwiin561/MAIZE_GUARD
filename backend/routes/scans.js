const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Return the URL
  res.json({ 
    imageUrl: `/public/uploads/${req.file.filename}` 
  });
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
