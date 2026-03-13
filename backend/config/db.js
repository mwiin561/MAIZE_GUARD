const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (uri) {
        const isAtlas = uri.includes('mongodb+srv');
        console.log(`Attempting to connect to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}...`);
        try {
            await mongoose.connect(uri, {
              useNewUrlParser: true,
              useUnifiedTopology: true,
              serverSelectionTimeoutMS: 5000
            });
            console.log(`Connected to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}!`);
            return;
        } catch (err) {
            console.warn(`Failed to connect to ${isAtlas ? 'Atlas/Local' : 'Database'}. Falling back to In-Memory DB...`);
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
