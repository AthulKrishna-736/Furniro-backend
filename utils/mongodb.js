import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error('Connection to MongoDB failed:', error);
    }
};
