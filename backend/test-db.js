const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabase() {
  try {
    console.log('--- Database Integrity & CRUD Test ---');
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
        console.error('❌ Error: MONGO_URI not found in .env file.');
        process.exit(1);
    }

    const isAtlas = uri.includes('mongodb+srv');
    console.log(`Connecting to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}...`);
    
    await mongoose.connect(uri);
    console.log('✅ Connection Successful!\n');

    const db = mongoose.connection.db;
    
    // 1. Check Collections
    const collections = await db.listCollections().toArray();
    console.log(`📂 Collections found: ${collections.map(c => c.name).join(', ')}`);

    // 2. Data Summary
    const userCount = await db.collection('users').countDocuments();
    const scanCount = await db.collection('scans').countDocuments();
    console.log(`👤 Users: ${userCount}`);
    console.log(`🌿 Scans: ${scanCount}\n`);

    // 3. CRUD Test: Create a temporary test record
    console.log('🛠 Starting CRUD Test...');
    const testId = 'test_' + Date.now();
    await db.collection('scans').insertOne({
        localId: testId,
        diagnosis: { modelPrediction: 'Testing Integrity', confidence: 0.99 },
        timestamp: new Date(),
        isTest: true
    });
    console.log('   ✅ Write test successful.');

    // 4. CRUD Test: Read & Verify
    const testRecord = await db.collection('scans').findOne({ localId: testId });
    if (testRecord) {
        console.log('   ✅ Read test successful.');
    } else {
        throw new Error('Could not find test record after writing!');
    }

    // 5. CRUD Test: Delete (Cleanup)
    await db.collection('scans').deleteOne({ localId: testId });
    console.log('   ✅ Delete (Cleanup) test successful.');

    console.log('\n🌟 ALL DATABASE TESTS PASSED 🌟');

  } catch (error) {
    console.error('\n❌ DATABASE TEST FAILED ❌');
    console.error('Error Details:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
        console.log('\n💡 DNS TROUBLESHOOTING:');
        console.log('1. Your computer cannot find the "cluster0.d9jcjuz.mongodb.net" address.');
        console.log('2. Try changing your DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1).');
        console.log('3. If you are on a VPN or school/office wifi, they might be blocking MongoDB.');
    }
    
    console.log('\n🔐 SECURITY CHECK:');
    console.log('Is your current IP whitelisted in MongoDB Atlas?');
    console.log('1. Go to your Atlas Website -> "Network Access" (on the left).');
    console.log('2. Click "Add IP Address" -> "Add Current IP Address".');
    console.log('3. Wait 1 minute for it to apply and try this script again.');
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected.');
    process.exit(0);
  }
}

testDatabase();
