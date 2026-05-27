from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.cache import cache
from backend.app.services.scraper_service import get_trending, get_chart, get_regional_trending

router = APIRouter()

@router.get("/trending")
async def api_trending(
    count: int = Query(8, le=50),
    region: str = Query("global", description="Region for trending movies (global, bollywood, south_indian, hollywood)"),
    api_key: str = Depends(verify_api_key)
):
    valid_regions = ["global", "bollywood", "south_indian", "hollywood"]
    if region not in valid_regions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid region '{region}'. Choose from {valid_regions}"
        )

    cache_key = f"trending:{region}:{count}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        if region == "global":
            results = await get_trending(count)
        else:
            results = await get_regional_trending(region, count)
            
        cache.set(cache_key, results, ttl=1800)  # cache trending for 30 minutes
        return {"success": True, "data": results, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/charts/{chart_type}")
async def api_chart(chart_type: str, limit: int = Query(250, le=250), api_key: str = Depends(verify_api_key)):
    valid_charts = ["top250", "popular", "boxoffice"]
    if chart_type not in valid_charts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid chart type '{chart_type}'. Choose from {valid_charts}"
        )
        
    cache_key = f"chart:{chart_type}:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return {"success": True, "data": cached, "source": "imdb", "cached": True}
        
    try:
        results = await get_chart(chart_type, limit=limit)
        # Cache for 1 hour for top/popular, or 6 hours for boxoffice since weekend boxoffice rarely changes
        ttl = 21600 if chart_type == "boxoffice" else 3600
        cache.set(cache_key, results, ttl=ttl)
        return {"success": True, "data": results, "source": "imdb"}
    except Exception as e:
        return {"success": False, "error": str(e)}
