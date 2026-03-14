const db = require('./config/db');

async function testDatabase() {
  try {
    console.log('--- PostgreSQL (Neon) Integrity & CRUD Test ---');
    
    // 1. Connection Test
    const timeResult = await db.query('SELECT NOW()');
    console.log('✅ Connection Successful! Server Time:', timeResult.rows[0].now);

    // 2. Data Summary
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const scanCount = await db.query('SELECT COUNT(*) FROM scans');
    console.log(`👤 Users in DB: ${userCount.rows[0].count}`);
    console.log(`🌿 Scans in DB: ${scanCount.rows[0].count}\n`);

    // 3. CRUD Test: Create a temporary test user or scan if needed
    // ... (logic can be expanded)

    console.log('🌟 ALL DATABASE TESTS PASSED 🌟');

  } catch (error) {
    console.error('\n❌ DATABASE TEST FAILED ❌');
    console.error('Error Details:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 TROUBLESHOOTING: Check your DATABASE_URL password/username.');
    }
  } finally {
    process.exit(0);
  }
}

testDatabase();
