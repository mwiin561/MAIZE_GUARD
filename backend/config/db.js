const { Pool } = require('pg');
require('dotenv').config();

// Use connection string from environment variables
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000, // Wait 15 seconds
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database (Neon)!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
