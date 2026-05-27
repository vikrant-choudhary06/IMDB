# CineAPI - IMDb Scraper REST API & Web Dashboard Platform

A high-performance full-stack web application converting the IMDb Python scraping modules into a scalable REST API service with an interactive React movie-streaming UI dashboard.

---

## Key Features

1. **REST API Service**: 13 high-performance GET endpoints covering text searches, filtered lookups, movies/series metadata, reviews, news, streaming availability, rank charts, and Rotten Tomatoes scores.
2. **Interactive Developer Dashboard**: Generate private API keys, inspect request metrics, track response latencies, and copy integration code snippets.
3. **Netflix-Inspired React Web UI**: Immersive dark mode design featuring glassmorphism, responsive tables, carousels, debounced live search, and inline video trailer players.
4. **Hybrid Dual-Layer Caching**: Automated Redis integration, falling back to a thread-safe local in-memory cache to bypass rate limits and speed up matching requests.
5. **SQLite Analytics Store**: Persistent database tracking developer key authorizations and logging route metrics.

---

## Tech Stack

### Backend
- **Core**: Python 3.10+, FastAPI, Uvicorn
- **Utilities**: Pydantic, Requests, SQLite3, Redis Cache
- **Performance**: ThreadPoolExecutor handling blocking scraper calls concurrently

### Frontend
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS (Dark theme design system)
- **Animations**: Framer Motion (page transitions and interactive tabs)
- **Utilities**: Axios, Lucide React Icons

---

## Quick Start (Local Run)

### 1. Start Backend Server
```bash
# Navigate to backend directory
cd backend/

# Install python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI will be available at `http://localhost:8000/docs`.

### 2. Start Frontend App
```bash
# Navigate to frontend directory
cd ../frontend/

# Install Node modules
npm install

# Start Vite developer server
npm run dev
```
Open your browser at `http://localhost:5173/` to view the web dashboard.

---

## Docker Compose Quick Start (Production Setup)

Spin up the entire platform (FastAPI + React UI static host + Redis Cache) instantly:

```bash
# From the root directory
docker-compose up --build
```
Once initialized:
- The unified web application is accessible at `http://localhost:8000/` (FastAPI handles routing API queries under `/api/*` and serves React UI static assets on `/`).
- Swagger API docs are available at `http://localhost:8000/docs`.

---

## API Endpoints List

All endpoints require passing the `x-api-key` header (you can use `demo_key_99f2b8` for testing).

| Endpoint | Description | Scraper Module |
|---|---|---|
| `GET /api/search?q={query}` | Suggestion string query | `search_by_string` |
| `GET /api/title/{id}` | Movie metadata by ID | `search_by_id` & `movie_info` |
| `GET /api/trending` | Top trending movies | `trending_downloader` |
| `GET /api/charts/{chart}` | Charts: `top250`, `popular`, `boxoffice` | `chart_downloader` |
| `GET /api/images/{id}` | Fetch image gallery urls | `images_dowloader` |
| `GET /api/videos/{id}` | Extract video metadata urls | `videos_downloader` |
| `GET /api/reviews/{id}` | Movie user reviews | `review_downloader` |
| `GET /api/news/{id}` | Movie/TV news feed | `news_downloader` |
| `GET /api/people/{name}` | Bio & headshot lookup | `people_downloader` |
| `GET /api/streaming/{id}` | Watch options & platforms | `streaming_availability` |
| `GET /api/rottentomatoes/{id}` | RT score card & stats | `rottentomatoes_downloader` |
| `GET /api/episodes/{id}` | Season episodes list | `season_episodes` |
| `GET /api/filter?genre={g}` | Advanced filtered lookup | `search_by_filters` |
| `GET /api/generate-key?owner={o}` | Register a new developer key | Custom Local DB |
| `GET /api/developer/stats` | Latency and logs breakdown | Custom Metrics |

---

## Reference: Original Scraping Scripts

The underlying command-line scraping scripts remain untouched and can be executed independently under `ImdbDataExtraction/`.

```bash
# Search movie by ID
python3 ImdbDataExtraction/search_by_id/search_movie.py tt0944947

# Search with filters
python3 ImdbDataExtraction/search_by_filters/search_by_filters.py --genre Action --min-rating 7 --pages 2

# Check streaming availability
python3 ImdbDataExtraction/streaming_availability/streaming_checker.py --title tt0899043
```
Refer to the individual readmes inside `ImdbDataExtraction/` subdirectories for detailed terminal usage options.
