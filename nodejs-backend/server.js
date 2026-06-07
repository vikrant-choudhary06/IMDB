import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from parent directory if not present
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "IMDb Node.js Scraper API is running!" });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
    console.log(`Node.js Server running on port ${PORT}`);
});
