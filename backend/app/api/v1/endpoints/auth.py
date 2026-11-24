from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.rate_limit import limiter
from app.core.security import create_access_token, get_current_admin, verify_password
from app.db.session import get_db
from app.models.entities import AdminUser
from app.schemas.schemas import AdminMeOut, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    admin = (
        db.query(AdminUser)
        .filter(
            func.lower(AdminUser.email) == str(body.email).strip().lower(),
            AdminUser.is_active.is_(True),
        )
        .first()
    )
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    return TokenResponse(access_token=create_access_token(admin.email))


@router.get("/me", response_model=AdminMeOut)
def get_me(admin: AdminUser = Depends(get_current_admin)) -> AdminMeOut:
    return AdminMeOut.model_validate(admin)
