import mongoose from 'mongoose';

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MongoDB URI not found in environment variables');
}

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default mongoose;