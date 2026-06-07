import express from 'express';
import { connectDB, hybridCache } from '../utils/cache.js';
import { config } from '../config.js';
import { searchByString, getTrendingMovies, getChart, getMovieDetails } from '../scrapers/core.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Initialize DB Connection
connectDB();

// API Key Middleware
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) {
        return res.status(401).json({ error: "API key is missing" });
    }
    // Simple check for demo (In real app, check DB)
    if (apiKey !== config.DEMO_API_KEY && !apiKey.startsWith("demo_")) {
        return res.status(401).json({ error: "Invalid API key" });
    }
    next();
};

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.DEFAULT_RATE_LIMIT,
    message: { error: "Too many requests, please try again later." }
});

router.use(limiter);

// 1. Search Route
router.get('/search', checkApiKey, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query parameter 'q' is required" });
    
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await hybridCache.get(cacheKey);
    if (cached) return res.json({ cached: true, data: cached });
    
    const results = await searchByString(query);
    await hybridCache.set(cacheKey, results);
    res.json({ cached: false, data: results });
});

// 2. Trending Route
router.get('/trending', checkApiKey, async (req, res) => {
    const cacheKey = "trending:global:8";
    const cached = await hybridCache.get(cacheKey);
    if (cached) return res.json({ cached: true, data: cached });
    
    const results = await getTrendingMovies(8);
    await hybridCache.set(cacheKey, results);
    res.json({ cached: false, data: results });
});

// 3. Charts Route
router.get('/charts/top250', checkApiKey, async (req, res) => {
    const cacheKey = "chart:top250";
    const cached = await hybridCache.get(cacheKey);
    if (cached) return res.json({ cached: true, data: cached });
    
    const results = await getChart("top", 250);
    await hybridCache.set(cacheKey, results);
    res.json({ cached: false, data: results });
});

// 4. Movie Details Route
router.get('/title/:id', checkApiKey, async (req, res) => {
    const id = req.params.id;
    const cacheKey = `title:${id}`;
    
    const cached = await hybridCache.get(cacheKey);
    if (cached) return res.json({ cached: true, data: cached });
    
    const details = await getMovieDetails(id);
    if (!details) return res.status(404).json({ error: "Title not found" });
    
    await hybridCache.set(cacheKey, details);
    res.json({ cached: false, data: details });
});

export default router;
