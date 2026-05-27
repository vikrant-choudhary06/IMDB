import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.config.config import settings
from backend.app.utils.database import initialize_db, log_request

# Route imports
from backend.app.routes import auth, search, titles, charts, news, people, rottentomatoes, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the SQLite database (creates tables, logs, demo key)
    initialize_db()
    yield
    # Cleanup (if any)

app = FastAPI(
    title="IMDb Scraper Platform API",
    description="A public REST API providing high-speed cached movie metadata, reviews, news, streaming availability, charts, and Rotten Tomatoes statistics.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Request Logging & Metrics Middleware
@app.middleware("http")
async def log_api_requests(request: Request, call_next):
    path = request.url.path
    # Only trace API endpoints
    if path.startswith("/api"):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Extract API key from headers (fallback to query params)
        api_key = request.headers.get("x-api-key") or request.query_params.get("api_key") or "anonymous"
        
        # Log to DB asynchronously in our thread pool
        try:
            log_request(api_key, path, process_time, response.status_code)
        except Exception as e:
            print(f"Metrics logging failed: {e}")
            
        return response
    else:
        return await call_next(request)

# Mount Routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(titles.router, prefix="/api", tags=["Titles"])
app.include_router(charts.router, prefix="/api", tags=["Charts & Trending"])
app.include_router(news.router, prefix="/api", tags=["News"])
app.include_router(people.router, prefix="/api", tags=["People / Actors"])
app.include_router(rottentomatoes.router, prefix="/api", tags=["Rotten Tomatoes"])
app.include_router(dashboard.router, prefix="/api", tags=["Developer Dashboard"])

# Mount React static files if the directory exists in production
import os
from fastapi.staticfiles import StaticFiles

current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.abspath(os.path.join(current_dir, "..", "static"))

if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to the IMDb Scraper REST API Platform. Go to /docs for Swagger documentation.",
            "docs_url": "/docs",
            "api_status": "healthy"
        }

