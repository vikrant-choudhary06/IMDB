from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import get_people_details

router = APIRouter()

@router.get("/people/{name}")
async def api_people(name: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"people:{name.lower().strip()}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        details = await get_people_details(name)
        if not details:
            return {"success": False, "error": "Person not found"}
        cache.set(cache_key, details, ttl=3600)  # cache people details for 1 hour
        return {"success": True, "data": details, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}
