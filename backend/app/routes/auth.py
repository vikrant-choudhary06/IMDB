import time
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from backend.app.utils.database import create_api_key

router = APIRouter()

class KeyGenResponse(BaseModel):
    success: bool
    api_key: str
    owner_name: str
    message: str

@router.get("/generate-key", response_model=KeyGenResponse)
async def generate_key(owner: str = Query(..., description="Developer name or project name for the key ownership")):
    try:
        new_key = create_api_key(owner)
        return KeyGenResponse(
            success=True,
            api_key=new_key,
            owner_name=owner,
            message="API Key generated successfully. Keep it secret and pass it in the 'x-api-key' header."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate API Key: {str(e)}"
        )
