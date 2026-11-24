import datetime as dt

from sqlalchemy.orm import Session

from app.models.entities import Testimonial
from app.schemas.schemas import TestimonialCreate, TestimonialUpdate


def _is_postgres(db: Session) -> bool:
    return db.bind is not None and db.bind.dialect.name == "postgresql"


def _clean_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def list_testimonials(
    db: Session,
    *,
    published_only: bool,
    category: str | None = None,
) -> list[Testimonial]:
    query = db.query(Testimonial)
    if published_only:
        query = query.filter(Testimonial.is_published.is_(True))
    if category:
        query = query.filter(Testimonial.category == category)

    return query.order_by(Testimonial.sort_order.asc(), Testimonial.id.desc()).all()


def create_testimonial(db: Session, data: TestimonialCreate) -> Testimonial:
    item = Testimonial(
        category=data.category,
        client_name=data.client_name.strip(),
        client_role=_clean_optional_str(data.client_role),
        company_or_institution=_clean_optional_str(data.company_or_institution),
        comment=data.comment.strip(),
        rating=data.rating,
        avatar_url=_clean_optional_str(data.avatar_url),
        sort_order=data.sort_order,
        is_published=data.is_published,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_testimonial(
    db: Session,
    testimonial_id: int,
    data: TestimonialUpdate,
) -> Testimonial | None:
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if item is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field in ("client_name", "comment"):
        if field in updates and updates[field] is not None:
            updates[field] = updates[field].strip()
    for field in ("client_role", "company_or_institution", "avatar_url"):
        if field in updates:
            updates[field] = _clean_optional_str(updates[field])

    non_nullable = {
        "category",
        "client_name",
        "comment",
        "rating",
        "sort_order",
        "is_published",
    }
    for field, value in updates.items():
        if field in non_nullable and value is None:
            continue
        setattr(item, field, value)

    if not _is_postgres(db):
        item.updated_at = dt.datetime.now(dt.UTC)

    db.commit()
    db.refresh(item)
    return item


def delete_testimonial(db: Session, testimonial_id: int) -> bool:
    item = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True
