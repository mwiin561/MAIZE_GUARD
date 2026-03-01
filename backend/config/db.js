const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb+srv://MAIZE-GUARD_ADMIN-DB:5TR0NGP%4055W0RD@cluster0.d9jcjuz.mongodb.net/?appName=Cluster0';

    if (uri) {
        console.log(`Attempting to connect to MongoDB Atlas...`);
        try {
            await mongoose.connect(uri, {
              useNewUrlParser: true,
              useUnifiedTopology: true,
              serverSelectionTimeoutMS: 5000 // 5s timeout
            });
            console.log('MongoDB Connected to Atlas!');
            return; // Success
        } catch (err) {
            console.warn('Failed to connect to MongoDB Atlas. Falling back to In-Memory DB...');
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
