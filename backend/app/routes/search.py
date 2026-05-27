from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import search_by_string, get_filtered_titles

router = APIRouter()

@router.get("/search")
async def api_search(q: str = Query(..., min_length=1), api_key: str = Depends(verify_api_key)):
    cache_key = f"search:{q.lower().strip()}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        results = await search_by_string(q)
        cache.set(cache_key, {"results": results}, ttl=1800)  # cache search for 30 mins
        return {"success": True, "data": {"results": results}, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/filter")
async def api_filter(
    genre: str = Query(None),
    year: str = Query(None, description="Specific year (e.g. 2024) or range (e.g. 2020-2024)"),
    rating: float = Query(None),
    sort: str = Query(None),
    limit: int = Query(20, le=100),
    api_key: str = Depends(verify_api_key)
):
    # Parse year range
    min_year = None
    max_year = None
    if year:
        if "-" in year:
            parts = year.split("-")
            if len(parts) == 2:
                min_year = int(parts[0]) if parts[0].isdigit() else None
                max_year = int(parts[1]) if parts[1].isdigit() else None
        elif year.isdigit():
            min_year = int(year)
            max_year = int(year)

    cache_key = f"filter:{genre}:{year}:{rating}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        results = await get_filtered_titles(
            genre=genre,
            min_year=min_year,
            max_year=max_year,
            min_rating=rating,
            limit=limit
        )
        cache.set(cache_key, results, ttl=1800)
        return {"success": True, "data": results, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}
