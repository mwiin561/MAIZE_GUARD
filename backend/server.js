const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
// connectDB(); // Commented out until you provide a MONGO_URI

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// Basic Route
app.get('/', (req, res) => {
  res.send('Maize Guard API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/scans', require('./routes/scans'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
