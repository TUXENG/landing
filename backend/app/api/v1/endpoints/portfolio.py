from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.entities import AdminUser
from app.schemas.schemas import (
    PortfolioCategory,
    PortfolioItemCreate,
    PortfolioItemOut,
    PortfolioItemUpdate,
)
from app.services import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=list[PortfolioItemOut])
def list_public_portfolio(
    category: PortfolioCategory | None = None,
    featured: bool | None = None,
    tag: str | None = Query(default=None, max_length=64),
    db: Session = Depends(get_db),
) -> list[PortfolioItemOut]:
    rows = portfolio_service.list_portfolio_items(
        db,
        published_only=True,
        category=category,
        featured=featured,
        tag=tag,
    )
    return [PortfolioItemOut.model_validate(row) for row in rows]


@router.get("/admin", response_model=list[PortfolioItemOut])
def list_admin_portfolio(
    category: PortfolioCategory | None = None,
    featured: bool | None = None,
    tag: str | None = Query(default=None, max_length=64),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[PortfolioItemOut]:
    rows = portfolio_service.list_portfolio_items(
        db,
        published_only=False,
        category=category,
        featured=featured,
        tag=tag,
    )
    return [PortfolioItemOut.model_validate(row) for row in rows]


@router.post("", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
def create_portfolio_item(
    body: PortfolioItemCreate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> PortfolioItemOut:
    item = portfolio_service.create_portfolio_item(db, body)
    return PortfolioItemOut.model_validate(item)


@router.patch("/{item_id}", response_model=PortfolioItemOut)
def update_portfolio_item(
    item_id: int,
    body: PortfolioItemUpdate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> PortfolioItemOut:
    item = portfolio_service.update_portfolio_item(db, item_id, body)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Elemento de portafolio no encontrado.",
        )
    return PortfolioItemOut.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    item_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> Response:
    deleted = portfolio_service.delete_portfolio_item(db, item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Elemento de portafolio no encontrado.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
