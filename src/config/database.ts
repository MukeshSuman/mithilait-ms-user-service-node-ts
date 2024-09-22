import mongoose from 'mongoose';
import { logger } from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/user-microservice';

export const connectDB = async (nextTry: number = 5000) => {
    try {
        await mongoose.connect(MONGODB_URI);

        mongoose.connection.on('connected', () => {
            logger.info('MongoDB connected');
        });

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
            console.log("nextTry", nextTry, "nextTry * 2", nextTry * 2);
            setTimeout(connectDB, nextTry * 2);
        });

    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};