import time
import requests
from pymongo import MongoClient
import os

# Load env variables directly from backend/.env for testing
env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
with open(env_path, "r") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            key, val = line.split("=", 1)
            os.environ[key] = val

MONGO_URI = os.getenv("MONGO_URI")
DEMO_KEY = os.getenv("DEMO_API_KEY", "demo_key_99f2b8")

def test_api():
    print(f"Testing MongoDB Connection to: {MONGO_URI}")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("[SUCCESS] Connected to MongoDB Atlas")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB Atlas: {e}")
        return

    print("Clearing test cache collection before testing...")
    db = client["imdb_scraper"]
    db.api_cache.delete_many({})

    # Base API URL
    API_URL = "http://127.0.0.1:8000/api"
    headers = {"x-api-key": DEMO_KEY}

    print("\n--- Testing Endpoints ---")
    
    # 1. Search Endpoint
    print("\n1. Testing Search Endpoint (/api/search?q=Inception)")
    start = time.time()
    res = requests.get(f"{API_URL}/search?q=Inception", headers=headers)
    t1 = time.time() - start
    print(f"First request took: {t1:.2f}s | Status: {res.status_code}")
    if res.status_code != 200:
        print(f"[ERROR] Search failed: {res.text}")
    else:
        print("[SUCCESS] Search returned data")

    # Let's check cache in MongoDB
    cache_doc = db.api_cache.find_one({"key": "search:inception"})
    if cache_doc:
        print("[SUCCESS] Cache document found in MongoDB")
    else:
        print("[ERROR] Cache document NOT found in MongoDB")

    # Second request should be fast (from cache)
    start = time.time()
    res2 = requests.get(f"{API_URL}/search?q=Inception", headers=headers)
    t2 = time.time() - start
    print(f"Second request (cached) took: {t2:.2f}s | Status: {res2.status_code}")
    if t2 < t1 and res2.json().get('cached'):
        print("[SUCCESS] Caching is working correctly for Search")
    else:
        print("[ERROR] Caching might not be working as expected or was too slow")

    # 2. Trending Endpoint
    print("\n2. Testing Trending Endpoint (/api/trending)")
    res = requests.get(f"{API_URL}/trending", headers=headers)
    print(f"Status: {res.status_code}")
    if res.status_code == 200 and len(res.json().get('data', [])) > 0:
        print("[SUCCESS] Trending returned data")
    else:
        print(f"[ERROR] Trending failed: {res.text}")

    # 3. Charts Endpoint
    print("\n3. Testing Charts Endpoint (/api/charts/top250)")
    res = requests.get(f"{API_URL}/charts/top250", headers=headers)
    print(f"Status: {res.status_code}")
    if res.status_code == 200 and len(res.json().get('data', [])) > 0:
        print("[SUCCESS] Charts returned data")
    else:
        print(f"[ERROR] Charts failed: {res.text}")

    print("\n--- All Tests Completed ---")

if __name__ == "__main__":
    test_api()
