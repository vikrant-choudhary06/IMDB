import mongoose from 'mongoose';
import { config } from '../config.js';

// Schema for cache
const cacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true }
});

// Create TTL index on expiresAt
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

let CacheModel;
let isConnected = false;

export const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(config.MONGO_URI, { dbName: 'imdb_scraper_node' });
        CacheModel = mongoose.model('ApiCache', cacheSchema);
        isConnected = true;
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

export const hybridCache = {
    get: async (key) => {
        if (!isConnected || !CacheModel) return null;
        try {
            const doc = await CacheModel.findOne({ key });
            if (doc && doc.expiresAt > new Date()) {
                return doc.value;
            } else if (doc) {
                // Manually delete if TTL hasn't run yet
                await CacheModel.deleteOne({ _id: doc._id });
            }
        } catch (e) {
            console.error("Cache Read Error:", e);
        }
        return null;
    },
    set: async (key, value, ttl = config.CACHE_TTL) => {
        if (!isConnected || !CacheModel) return;
        try {
            const expiresAt = new Date(Date.now() + ttl * 1000);
            await CacheModel.updateOne(
                { key },
                { $set: { value, expiresAt } },
                { upsert: true }
            );
        } catch (e) {
            console.error("Cache Write Error:", e);
        }
    }
};
