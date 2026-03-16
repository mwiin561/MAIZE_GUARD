const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Configure neon to use the 'ws' package for websockets
// This allows connecting via port 443, bypassing ISP blocks on port 5432
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  connectionTimeoutMillis: 15000, 
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('connect', () => {
  console.log('✅ Connected to Neon DB via Websockets! (Port 443)');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
