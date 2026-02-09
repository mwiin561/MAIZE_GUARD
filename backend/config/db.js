const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Check if MONGO_URI is defined
    if (!uri) {
        console.warn('MONGO_URI is not defined in .env file. Using In-Memory DB.');
    } else {
        console.log(`Attempting to connect to ${uri}...`);
        try {
            await mongoose.connect(uri, {
              useNewUrlParser: true,
              useUnifiedTopology: true,
              serverSelectionTimeoutMS: 5000 // 5s timeout
            });
            console.log('MongoDB Connected...');
            return; // Success
        } catch (err) {
            console.warn('Failed to connect to provided MONGO_URI. Falling back to In-Memory DB...');
        }
    }

    // Fallback to Memory Server
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    
    await mongoose.connect(memoryUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`InMemory MongoDB Connected at ${memoryUri}`);

  } catch (err) {
    console.error('Fatal Database Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
