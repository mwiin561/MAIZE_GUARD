const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Database pool check
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('⚠️ Initial DB check failed (will retry on request):', err.message);
  } else {
    console.log('✅ Connected to Neon DB successfully!');
  }
});



const app = express();

const path = require('path');

// Middleware
app.use(cors());
// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
// Allow large JSON bodies for upload-image-web (base64 images) and sync batches
app.use(express.json({ limit: '25mb' }));

// Static folder for serving models
app.use('/public', express.static(path.join(__dirname, 'public')));


// Basic Route
app.get('/', (req, res) => {
  res.send('Maize Guard API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/scans', require('./routes/scans'));
app.use('/api/admin', require('./routes/admin'));

// Top-level /predict endpoint for mobile APK inference
const multer = require('multer');
const fs = require('fs');
const uploadPredict = multer({ dest: 'uploads/' });
app.post('/predict', uploadPredict.single('image'), async (req, res) => {
  try {
    const serviceUrl = process.env.TFLITE_SERVICE_URL || 'http://localhost:5003';
    let base64Image;

    if (req.file) {
      const buf = fs.readFileSync(req.file.path);
      base64Image = `data:image/jpeg;base64,${buf.toString('base64')}`;
      fs.unlinkSync(req.file.path); // clean up
    } else if (req.body && req.body.imageData) {
      base64Image = req.body.imageData;
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    const pyRes = await fetch(`${serviceUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64Image }),
    });

    if (!pyRes.ok) throw new Error(`AI service: ${pyRes.status}`);
    const data = await pyRes.json();
    res.json(data);
  } catch (e) {
    console.error('Predict error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
