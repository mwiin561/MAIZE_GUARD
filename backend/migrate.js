const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
  try {
    console.log('--- Neon DB Migration ---');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await db.query(sql);
    
    console.log('✅ Tables created/verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err.message);
    process.exit(1);
  }
};

migrate();
