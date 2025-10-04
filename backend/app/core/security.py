from fastapi import Header, HTTPException, status
from .config import settings


async def require_api_key(x_api_key: str | None = Header(default=None)):
    # If API_KEY not set, allow all (dev-friendly). Otherwise enforce exact match.
    if settings.api_key is None:
        return
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


