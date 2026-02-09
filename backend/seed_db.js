const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// User Model (Simplified)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  region: String,
  farmSize: String,
  date: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maizeguard';
    console.log(`Connecting to ${uri}...`);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected!');

    // Check if data exists
    const count = await User.countDocuments();
    if (count === 0) {
        console.log('No users found. Creating sample data...');
        await User.create({
            name: 'Initial Developer User',
            email: 'dev@maizeguard.com',
            region: 'Test Region',
            farmSize: '5 Acres'
        });
        console.log('Sample User Created!');
    } else {
        console.log(`Database already has ${count} users.`);
    }

    console.log('SUCCESS: Database "maizeguard" should now be visible in Compass.');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
