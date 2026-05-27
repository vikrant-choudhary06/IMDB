from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import get_news

router = APIRouter()

@router.get("/news/{id}")
async def api_news(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"news:{id.lower().strip()}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        results = await get_news(id)
        cache.set(cache_key, results, ttl=3600)  # cache news for 1 hour
        return {"success": True, "data": results, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}
