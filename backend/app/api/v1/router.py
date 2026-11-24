from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    content,
    health,
    leads,
    portfolio,
    testimonials,
    uploads,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(content.router)
api_router.include_router(leads.router)
api_router.include_router(portfolio.router)
api_router.include_router(testimonials.router)
api_router.include_router(auth.router)
api_router.include_router(uploads.router)
