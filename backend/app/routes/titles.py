from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import (
    get_title_details,
    get_title_images_async,
    get_title_videos_async,
    get_title_reviews_async,
    get_title_streaming_async,
    get_title_episodes
)

router = APIRouter()

@router.get("/title/{id}")
async def api_title_details(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"title:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        details = await get_title_details(id)
        if not details:
            return {"success": False, "error": "Movie not found"}
        cache.set(cache_key, details, ttl=3600)  # cache movie details for 1 hour
        return {"success": True, "data": details, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/images/{id}")
async def api_title_images(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"images:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        images = await get_title_images_async(id)
        cache.set(cache_key, images, ttl=3600)
        return {"success": True, "data": images, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/videos/{id}")
async def api_title_videos(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"videos:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        videos = await get_title_videos_async(id)
        cache.set(cache_key, videos, ttl=3600)
        return {"success": True, "data": videos, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/reviews/{id}")
async def api_title_reviews(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"reviews:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        reviews = await get_title_reviews_async(id)
        cache.set(cache_key, reviews, ttl=3600)
        return {"success": True, "data": reviews, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/streaming/{id}")
async def api_title_streaming(id: str, api_key: str = Depends(verify_api_key)):
    cache_key = f"streaming:{id}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        streaming = await get_title_streaming_async(id)
        cache.set(cache_key, streaming, ttl=3600)
        return {"success": True, "data": streaming, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/episodes/{id}")
async def api_title_episodes(id: str, limit: int = Query(50, le=200), api_key: str = Depends(verify_api_key)):
    cache_key = f"episodes:{id}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        episodes = await get_title_episodes(id, limit=limit)
        cache.set(cache_key, episodes, ttl=3600)
        return {"success": True, "data": episodes, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}
