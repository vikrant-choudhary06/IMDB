from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import get_rottentomatoes_data

router = APIRouter()

@router.get("/rottentomatoes/{id}")
async def api_rottentomatoes(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"rottentomatoes:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "rottentomatoes", "cached": True}
        
    try:
        data = await get_rottentomatoes_data(id)
        if not data:
            return {"success": False, "error": "Rotten Tomatoes data not found for this title"}
        cache.set(cache_key, data, ttl=3600)  # cache RT scores for 1 hour
        return {"success": True, "data": data, "source": "rottentomatoes"}
    except Exception as e:
        return {"success": False, "error": str(e)}
