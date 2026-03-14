const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

// Database pool check
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Initial PostgreSQL connection failed:', err.message);
  } else {
    console.log('PostgreSQL initial query successful.');
  }
});



const app = express();

const path = require('path');

// Middleware
app.use(cors());
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
