const { Pool } = require('pg');
require('dotenv').config();

// Use connection string from environment variables
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Neon and many hosted PostgreSQL services
  }
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
