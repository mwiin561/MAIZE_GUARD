const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const test = async () => {
  console.log('--- 🛡️ Neon Connection Diagnostic 🛡️ ---');
  console.log('Target URL:', connectionString.split('@')[1]); // Show only host for security

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000, // 20 seconds
  });

  console.log('Attempting connection (Waiting up to 20s for Neon to wake up)...');
  
  try {
    const start = Date.now();
    const client = await pool.connect();
    const duration = Date.now() - start;
    
    console.log(`✅ Success! Connected in ${duration}ms`);
    
    const res = await client.query('SELECT NOW() as now, current_database() as db');
    console.log('📊 Server Time:', res.rows[0].now);
    console.log('📂 Database Name:', res.rows[0].db);
    
    client.release();
    await pool.end();
    console.log('\n🌟 CONNECTION VERIFIED 🌟');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection Failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    
    if (err.message.includes('timeout')) {
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('1. Your IP address might be blocked. Check Neon Console -> IP Allowlist.');
      console.log('2. Your local Firewall or VPN might be blocking Port 5432.');
      console.log('3. The database is in a deep sleep. Try running this script again.');
    }
    
    await pool.end();
    process.exit(1);
  }
};

test();
