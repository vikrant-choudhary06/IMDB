import time
import json
import threading
from datetime import datetime, timezone, timedelta
from backend.app.config.config import settings

# Attempt to import pymongo
try:
    import pymongo
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

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
        self.mongo_client = None
        self.collection = None
        self.local_cache = LocalCache()
        
        if MONGO_AVAILABLE:
            try:
                # Fail fast connection
                self.mongo_client = pymongo.MongoClient(
                    settings.MONGO_URI, 
                    serverSelectionTimeoutMS=2000
                )
                # Test connection
                self.mongo_client.admin.command('ping')
                
                db = self.mongo_client["imdb_scraper"]
                self.collection = db["api_cache"]
                
                # Create TTL index on expiresAt field
                self.collection.create_index(
                    "expiresAt", 
                    expireAfterSeconds=0, 
                    background=True
                )
                # Create a unique index on the key
                self.collection.create_index("key", unique=True, background=True)
                
                print("Connected to MongoDB successfully.")
            except Exception as e:
                print(f"Warning: Could not connect to MongoDB: {e}. Falling back to in-memory caching.")
                self.mongo_client = None
                self.collection = None
        else:
            print("Warning: pymongo package is not installed. Falling back to in-memory caching.")

    def get(self, key: str):
        if self.collection is not None:
            try:
                # MongoDB query
                doc = self.collection.find_one({"key": key})
                if doc:
                    # Check if manually expired (in case TTL monitor hasn't run yet)
                    if doc.get("expiresAt") and doc["expiresAt"].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                        self.collection.delete_one({"_id": doc["_id"]})
                        return None
                    return doc.get("value")
            except Exception as e:
                print(f"MongoDB cache read error: {e}")
                return self.local_cache.get(key)
        return self.local_cache.get(key)

    def set(self, key: str, val, ttl: int = None):
        # Set default TTL if none provided
        if ttl is None:
            ttl = settings.CACHE_TTL
            
        if self.collection is not None:
            try:
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)
                # Upsert cache entry
                self.collection.update_one(
                    {"key": key},
                    {"$set": {"value": val, "expiresAt": expires_at}},
                    upsert=True
                )
                return
            except Exception as e:
                print(f"MongoDB cache write error: {e}")
                
        # Fallback/Local write
        self.local_cache.set(key, val, ttl)

cache = HybridCache()
