from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.entities import AdminUser


def _ensure_initial_admin() -> None:
    if not settings.admin_email or not settings.admin_initial_password:
        return
    try:
        with SessionLocal() as db:
            exists = db.query(AdminUser).filter(AdminUser.email == settings.admin_email.lower()).first()
            if exists is None:
                db.add(
                    AdminUser(
                        email=settings.admin_email.lower(),
                        password_hash=hash_password(settings.admin_initial_password),
                        is_active=True,
                    )
                )
                db.commit()
    except Exception:
        # Si las migraciones aún no corrieron, no impedir el arranque para poder correr alembic
        pass


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _ensure_initial_admin()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/api/v1/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(api_router)
