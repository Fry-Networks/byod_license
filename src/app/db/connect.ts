import mongoose from 'mongoose';
import 'dotenv/config';
import { EventEmitter } from 'node:events';

let connectionPromise: Promise<typeof mongoose> | null = null;
let listenersAttached = false;

export async function connect() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI not set!');
    }

    if (!listenersAttached) {
        mongoose.connection.on('connected', () => {
            console.log('Connected to MongoDB!');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Mongoose connection error:\n${err.stack}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Disconnected from MongoDB!');
        });

        listenersAttached = true;
    }

    if (!connectionPromise) {
        console.log('Connecting to MongoDB...');
        connectionPromise = mongoose.connect(uri).catch((error) => {
            connectionPromise = null;
            throw error;
        });
    }

    await connectionPromise;
}

export const newApiKeyEvent = new EventEmitter();
