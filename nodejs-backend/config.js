import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', '.env') });

export const config = {
    PORT: process.env.PORT || 8080,
    MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017",
    CACHE_TTL: parseInt(process.env.CACHE_TTL || "3600", 10),
    DEMO_API_KEY: process.env.DEMO_API_KEY || "demo_key_99f2b8",
    DEFAULT_RATE_LIMIT: parseInt(process.env.DEFAULT_RATE_LIMIT || "60", 10)
};
