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


def _matches_magic_bytes(content_type: str, raw: bytes) -> bool:
    if content_type == "image/png":
        return raw.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/jpeg":
        return raw.startswith(b"\xff\xd8\xff")
    if content_type == "image/webp":
        return len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"
    return False


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _admin: AdminUser = Depends(get_current_admin),
) -> UploadResponse:
    content_type = (file.content_type or "").lower()
    ext = ALLOWED_MIME.get(content_type)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato no permitido. Usa WebP, PNG o JPEG.",
        )

    max_bytes = max(1, settings.max_upload_mb) * 1024 * 1024
    raw = await file.read(max_bytes + 1)
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío.",
        )
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Archivo demasiado grande (máximo {settings.max_upload_mb} MB).",
        )
    if not _matches_magic_bytes(content_type, raw):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido del archivo no coincide con una imagen válida (WebP, PNG o JPEG).",
        )

    dest_dir = Path(settings.upload_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (dest_dir / filename).write_bytes(raw)

    return UploadResponse(filename=filename, url=f"/uploads/{filename}", size_bytes=len(raw))
