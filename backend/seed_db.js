const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  try {
    console.log('--- PostgreSQL Seeding ---');

    // 1. Check if users exist
    const userResult = await db.query('SELECT COUNT(*) FROM users');
    const count = parseInt(userResult.rows[0].count);

    if (count === 0) {
      console.log('No users found. Creating sample data...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await db.query(
        'INSERT INTO users (name, email, password, region, farm_size) VALUES ($1, $2, $3, $4, $5)',
        ['Initial Developer User', 'dev@maizeguard.com', hashedPassword, 'Test Region', '5 Acres']
      );
      
      console.log('✅ Sample User Created! (Email: dev@maizeguard.com, Password: password123)');
    } else {
      console.log(`💡 Database already has ${count} users. Skipping seeding.`);
    }

    console.log('\n🌟 SEEDING COMPLETE 🌟');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDB();
