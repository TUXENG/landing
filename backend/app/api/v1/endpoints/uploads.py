import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import get_current_admin
from app.models.entities import AdminUser
from app.schemas.schemas import UploadResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_MIME = {
    "image/webp": ".webp",
    "image/png": ".png",
    "image/jpeg": ".jpg",
}


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _admin: AdminUser = Depends(get_current_admin),
) -> UploadResponse:
    ext = ALLOWED_MIME.get(file.content_type or "")
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no permitido. Usa WebP, PNG o JPEG.",
        )

    max_bytes = max(1, settings.max_upload_mb) * 1024 * 1024
    raw = await file.read(max_bytes + 1)
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Archivo demasiado grande (máximo {settings.max_upload_mb} MB).",
        )

    dest_dir = Path(settings.upload_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (dest_dir / filename).write_bytes(raw)

    return UploadResponse(filename=filename, url=f"/uploads/{filename}", size_bytes=len(raw))
