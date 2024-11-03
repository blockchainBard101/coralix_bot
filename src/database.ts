import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Atlas connection URI from .env
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/CORALIX_BOT_USERS';

// Connect to MongoDB Atlas
export const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};
