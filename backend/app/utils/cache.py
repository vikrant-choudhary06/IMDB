import time
import json
import threading
from backend.app.config.config import settings

# Attempt to import redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class LocalCache:
    """Thread-safe in-memory cache with TTL support"""
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
        
    def get(self, key: str):
        with self._lock:
            if key not in self._cache:
                return None
            val, expires = self._cache[key]
            if expires is not None and time.time() > expires:
                # Key expired, delete it
                del self._cache[key]
                return None
            return val
            
    def set(self, key: str, val, ttl: int = None):
        expires = (time.time() + ttl) if ttl is not None else None
        with self._lock:
            self._cache[key] = (val, expires)
            
    def clear(self):
        with self._lock:
            self._cache.clear()

class HybridCache:
    def __init__(self):
        self.redis_client = None
        self.local_cache = LocalCache()
        
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD or None,
                    decode_responses=True,
                    socket_connect_timeout=2  # Fail fast
                )
                # Test connection
                self.redis_client.ping()
                print("Connected to Redis successfully.")
            except Exception as e:
                print(f"Warning: Could not connect to Redis: {e}. Falling back to in-memory caching.")
                self.redis_client = None
        else:
            print("Warning: Redis package is not installed. Falling back to in-memory caching.")

    def get(self, key: str):
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                print(f"Redis cache read error: {e}")
                # Fallback to local
                return self.local_cache.get(key)
        return self.local_cache.get(key)

    def set(self, key: str, val, ttl: int = None):
        # Set default TTL if none provided
        if ttl is None:
            ttl = settings.CACHE_TTL
            
        if self.redis_client:
            try:
                serialized = json.dumps(val)
                self.redis_client.set(key, serialized, ex=ttl)
                return
            except Exception as e:
                print(f"Redis cache write error: {e}")
                
        # Fallback/Local write
        self.local_cache.set(key, val, ttl)

cache = HybridCache()
