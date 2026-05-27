# CineAPI - IMDb Scraper Platform API Usage Guide

Welcome to the **CineAPI** developer documentation. This guide explains what this API is, how it works under the hood, how to authenticate, and how to query all available endpoints.

---

## 1. Overview & Architecture

**CineAPI** is a REST API platform built with **FastAPI** that provides cached IMDb movie metadata, reviews, news, streaming availability, charts, and Rotten Tomatoes ratings.

### How it works:
1. **Scraping Engine**: When a title is requested, the backend scrapes IMDb's internal GraphQL suggestion endpoints and JSON-LD payloads to extract detailed information in real-time.
2. **Caching Layer**: To maintain high performance and bypass rate limits, the API implements a **Hybrid Cache** (via Redis with a local thread-safe in-memory fallback). If Redis is unavailable, it seamlessly falls back to memory.
3. **SQLite Registry**: API keys and developer analytics are stored in a local SQLite database (`api_keys.db`).

---

## 2. Authentication

All requests to endpoints (except `/api/generate-key`) require an API key passed in the headers.

* **Header Name**: `x-api-key`
* **Default Demo Key**: `demo_key_99f2b8` (built-in for sandbox/testing)

### Generate a Custom API Key:
To generate your own custom API key, make a `GET` request to:
`http://localhost:8000/api/generate-key?owner=YOUR_NAME`

---

## 3. API Endpoints Reference

### 🔐 Authentication

#### `GET /api/generate-key`
Generates a new custom API Key.
* **Query Parameters:**
  * `owner` (string, required): Developer or project name.
* **Response:**
  ```json
  {
    "success": true,
    "api_key": "apikey_5f8a92...",
    "owner_name": "John Doe",
    "message": "API Key generated successfully. Keep it secret and pass it in the 'x-api-key' header."
  }
  ```

---

### 🔍 Search & Filtering

#### `GET /api/search`
Search movies, TV shows, and actors using IMDb suggestions.
* **Query Parameters:**
  * `q` (string, required): Search query (e.g., `off campus`, `interstellar`).
* **Response:**
  ```json
  {
    "success": true,
    "data": {
      "results": [
        {
          "type": "Title",
          "id": "tt33546863",
          "name": "Off Campus",
          "year": 2026,
          "description": "Ella Bright, Belmont Cameli",
          "rank": 2,
          "image": "https://m.media-amazon.com/images/M/..."
        }
      ]
    },
    "source": "imdb"
  }
  ```

#### `GET /api/filter`
Filter titles by genre, release year, or IMDb rating.
* **Query Parameters:**
  * `genre` (string, optional): Genre name (e.g. `Action`, `Drama`).
  * `year` (string, optional): Specific year (e.g. `2024`) or range (e.g. `2020-2024`).
  * `rating` (float, optional): Minimum rating (e.g. `7.5`).
  * `limit` (int, optional, default: 20): Results limit.

---

### 🎬 Title Details & Metadata

#### `GET /api/title/{id}`
Returns complete details of a specific title (movie or TV series).
* **Path Parameters:**
  * `id` (string, required): IMDb ID (e.g., `tt33546863`).
* **Response fields:** includes title, rating, genres, plot description, poster, cast list, streaming options, user reviews, and gallery images.

#### `GET /api/images/{id}`
Get the image gallery of a specific title.

#### `GET /api/videos/{id}`
Get all associated promotional videos, clips, and trailers.

#### `GET /api/reviews/{id}`
Retrieve featured user reviews.

#### `GET /api/streaming/{id}`
Returns legal streaming, buying, or renting options with direct links and provider logos.

#### `GET /api/episodes/{id}`
Retrieve a list of episodes for a TV series.
* **Query Parameters:**
  * `limit` (int, optional, default: 50): Number of episodes to return.

---

### 📈 Charts & Trending

#### `GET /api/trending`
Get the current trending titles.
* **Query Parameters:**
  * `count` (int, optional, default: 8, max: 50): Number of items.

#### `GET /api/charts/{chart_type}`
Retrieve rankings from curated charts.
* **Path Parameters:**
  * `chart_type` (string, required): Choose from `top250` (Top 250 Movies), `popular` (Most Popular), or `boxoffice` (Weekend Box Office Mojo grosses).
* **Query Parameters:**
  * `limit` (int, optional, default: 250): Number of records.

---

### 👤 Cast & News

#### `GET /api/people/{name_or_id}`
Retrieve actor, writer, or director information, biography, filmography ("known for"), star ranking, and quotes.
* **Path Parameters:**
  * `name_or_id` (string, required): Actor's name (e.g., `Leonardo DiCaprio`) or IMDb ID (e.g., `nm0000138`).

#### `GET /api/news/{id_or_category}`
Get latest movie/entertainment news.
* **Path Parameters:**
  * `id_or_category` (string, required): Title ID (e.g. `tt33546863`) or category name (e.g. `CELEB`, `MOVIE`).

---

### 🍅 Rotten Tomatoes Integration

#### `GET /api/rottentomatoes/{id}`
Retrieves parsed Rotten Tomatoes Tomatometer rating, audience score, and review summaries mapped from the IMDb ID.
* **Path Parameters:**
  * `id` (string, required): IMDb ID.

---

### 📊 Developer Dashboard

#### `GET /api/developer/stats`
Get statistics for the supplied API Key, including total requests, average response times, endpoint usage breakdowns, and hourly request metrics.

---

## 4. Code Examples

### Curl
```bash
curl -X GET "http://localhost:8000/api/trending?count=3" \
     -H "x-api-key: demo_key_99f2b8"
```

### JavaScript (fetch)
```javascript
const options = {
  method: 'GET',
  headers: {
    'x-api-key': 'demo_key_99f2b8'
  }
};

fetch('http://localhost:8000/api/title/tt33546863', options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Python (requests)
```python
import requests

url = "http://localhost:8000/api/title/tt33546863"
headers = {
    "x-api-key": "demo_key_99f2b8"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    print(response.json())
else:
    print(f"Error {response.status_code}: {response.text}")
```
