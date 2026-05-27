from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.utils.auth import verify_api_key
from backend.app.utils.database import get_developer_stats

router = APIRouter()

@router.get("/developer/stats")
async def api_developer_stats(api_key: str = Depends(verify_api_key)):
    try:
        stats = get_developer_stats(api_key)
        return {"success": True, "data": stats, "source": "local_db"}
    except Exception as e:
        return {"success": False, "error": str(e)}
