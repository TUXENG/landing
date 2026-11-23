from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.redis import redis_ping
from app.db.session import get_db
from app.schemas.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    rd_ok = redis_ping()
    resp = HealthResponse(
        status="ok" if db_ok else "degraded",
        database="ok" if db_ok else "error",
        redis="ok" if rd_ok else "unavailable",
        environment=settings.environment,
    )
    if not db_ok:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=resp.model_dump())
    return resp
