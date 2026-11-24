import datetime as dt

from fastapi import HTTPException, status
from sqlalchemy import bindparam
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.entities import PortfolioItem
from app.schemas.schemas import PortfolioItemCreate, PortfolioItemUpdate


def _is_postgres(db: Session) -> bool:
    return db.bind is not None and db.bind.dialect.name == "postgresql"


def _clean_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _clean_tags(tags: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        item = tag.strip()
        if item and item not in seen:
            seen.add(item)
            cleaned.append(item)
    return cleaned


def list_portfolio_items(
    db: Session,
    *,
    published_only: bool,
    category: str | None = None,
    featured: bool | None = None,
    tag: str | None = None,
) -> list[PortfolioItem]:
    query = db.query(PortfolioItem)
    if published_only:
        query = query.filter(PortfolioItem.is_published.is_(True))
    if category:
        query = query.filter(PortfolioItem.category == category)
    if featured is not None:
        query = query.filter(PortfolioItem.is_featured.is_(featured))

    clean_tag = tag.strip() if tag else None
    is_pg = _is_postgres(db)
    if clean_tag and is_pg:
        query = query.filter(
            PortfolioItem.tech_tags.op("@>")(
                bindparam("tag_json", [clean_tag], type_=JSONB())
            )
        )

    rows = query.order_by(
        PortfolioItem.is_featured.desc(),
        PortfolioItem.sort_order.asc(),
        PortfolioItem.id.desc(),
    ).all()

    if clean_tag and not is_pg:
        rows = [item for item in rows if clean_tag in (item.tech_tags or [])]

    return rows


def create_portfolio_item(db: Session, data: PortfolioItemCreate) -> PortfolioItem:
    item = PortfolioItem(
        category=data.category,
        title=data.title.strip(),
        slug=_clean_optional_str(data.slug),
        client_label=_clean_optional_str(data.client_label),
        description=data.description.strip(),
        tech_tags=_clean_tags(data.tech_tags),
        image_url=data.image_url.strip(),
        before_image_url=_clean_optional_str(data.before_image_url),
        demo_url=_clean_optional_str(data.demo_url),
        video_url=_clean_optional_str(data.video_url),
        is_featured=data.is_featured,
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un proyecto de portafolio con ese slug.",
        )
    db.refresh(item)
    return item


def update_portfolio_item(
    db: Session,
    item_id: int,
    data: PortfolioItemUpdate,
) -> PortfolioItem | None:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if item is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field in ("title", "description", "image_url"):
        if field in updates and updates[field] is not None:
            updates[field] = updates[field].strip()
    for field in ("slug", "client_label", "before_image_url", "demo_url", "video_url"):
        if field in updates:
            updates[field] = _clean_optional_str(updates[field])
    if "tech_tags" in updates and updates["tech_tags"] is not None:
        updates["tech_tags"] = _clean_tags(updates["tech_tags"])

    non_nullable = {
        "category",
        "title",
        "description",
        "tech_tags",
        "image_url",
        "is_featured",
        "sort_order",
        "is_published",
    }
    for field, value in updates.items():
        if field in non_nullable and value is None:
            continue
        setattr(item, field, value)

    if not _is_postgres(db):
        item.updated_at = dt.datetime.now(dt.UTC)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un proyecto de portafolio con ese slug.",
        )
    db.refresh(item)
    return item


def delete_portfolio_item(db: Session, item_id: int) -> bool:
    item = db.query(PortfolioItem).filter(PortfolioItem.id == item_id).first()
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True
