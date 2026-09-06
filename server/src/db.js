import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @param {string} [uri] - Optional MongoDB URI override
 */
export async function connectDB(uri) {
  const mongoURI = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/tutorflow';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

// Listen to disconnected event
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});
