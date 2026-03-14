const db = require('./config/db');

async function fixSchema() {
  try {
    console.log('--- 🛠️ Neon DB Schema Fix: Adding Unique Constraint ---');
    
    // 1. Add Unique constraint to local_id if it doesn't exist
    // We try to add it, if it fails because it already exists, that's fine.
    await db.query(`
      ALTER TABLE scans 
      ADD CONSTRAINT unique_local_id UNIQUE (local_id);
    `);
    
    console.log('✅ Unique constraint added successfully!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('💡 Constraint already exists. No action needed.');
    } else {
      console.error('❌ Error applying fix:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

fixSchema();
