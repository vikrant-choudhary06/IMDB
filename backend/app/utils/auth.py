import time
import threading
from fastapi import Header, HTTPException, status, Request
from backend.app.utils.database import validate_api_key
from backend.app.config.config import settings

class RateLimiter:
    """Thread-safe sliding window rate limiter"""
    def __init__(self):
        self._requests = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, identifier: str, limit: int, period: int = 60) -> bool:
        now = time.time()
        with self._lock:
            # Get existing requests for identifier
            timestamps = self._requests.get(identifier, [])
            
            # Clean up old timestamps (older than 1 minute)
            timestamps = [t for t in timestamps if now - t < period]
            
            if len(timestamps) >= limit:
                self._requests[identifier] = timestamps
                return False  # Rate limit exceeded
                
            timestamps.append(now)
            self._requests[identifier] = timestamps
            return True  # Allowed

limiter = RateLimiter()

async def verify_api_key(request: Request, x_api_key: str = Header(None)) -> str:
    # If API key is missing
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key missing. Please provide the 'x-api-key' header."
        )

    # Check in SQLite database
    if not validate_api_key(x_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key."
        )
        
    # Enforce rate limit (100 requests/min for demo key, or default from config)
    limit = settings.DEFAULT_RATE_LIMIT
    if x_api_key == settings.DEMO_API_KEY:
        limit = 120  # Give the public frontend clients a slightly higher limit
        
    # Check rate limit
    if not limiter.check_rate_limit(x_api_key, limit):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again in a minute."
        )

    return x_api_key
