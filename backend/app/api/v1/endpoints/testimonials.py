from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.entities import AdminUser
from app.schemas.schemas import (
    LeadCategory,
    TestimonialCreate,
    TestimonialOut,
    TestimonialUpdate,
)
from app.services import testimonial_service

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


@router.get("", response_model=list[TestimonialOut])
def list_public_testimonials(
    category: LeadCategory | None = None,
    db: Session = Depends(get_db),
) -> list[TestimonialOut]:
    rows = testimonial_service.list_testimonials(
        db,
        published_only=True,
        category=category,
    )
    return [TestimonialOut.model_validate(row) for row in rows]


@router.get("/admin", response_model=list[TestimonialOut])
def list_admin_testimonials(
    category: LeadCategory | None = None,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[TestimonialOut]:
    rows = testimonial_service.list_testimonials(
        db,
        published_only=False,
        category=category,
    )
    return [TestimonialOut.model_validate(row) for row in rows]


@router.post("", response_model=TestimonialOut, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    body: TestimonialCreate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> TestimonialOut:
    item = testimonial_service.create_testimonial(db, body)
    return TestimonialOut.model_validate(item)


@router.patch("/{testimonial_id}", response_model=TestimonialOut)
def update_testimonial(
    testimonial_id: int,
    body: TestimonialUpdate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> TestimonialOut:
    item = testimonial_service.update_testimonial(db, testimonial_id, body)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonio no encontrado.",
        )
    return TestimonialOut.model_validate(item)


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> Response:
    deleted = testimonial_service.delete_testimonial(db, testimonial_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonio no encontrado.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
