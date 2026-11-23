from typing import Any

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.entities import AdminUser
from app.schemas.schemas import ContentSectionOut, ContentUpdate
from app.services import content_service

router = APIRouter(prefix="/content", tags=["content"])


@router.get("", response_model=dict[str, dict[str, Any]])
def list_content(db: Session = Depends(get_db)) -> dict[str, dict[str, Any]]:
    return content_service.get_all_content(db)


@router.put("/{slug}", response_model=ContentSectionOut)
def update_content_section(
    body: ContentUpdate,
    slug: str = Path(pattern="^[a-z0-9_-]{2,64}$"),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> ContentSectionOut:
    row = content_service.upsert_section(db, slug, body.title, body.payload)
    return ContentSectionOut.model_validate(row)
