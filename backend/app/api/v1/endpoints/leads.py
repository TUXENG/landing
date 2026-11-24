from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.rate_limit import get_real_client_ip, limiter
from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.entities import AdminUser
from app.schemas.schemas import (
    LeadAdminOut,
    LeadCategory,
    LeadConfirmation,
    LeadCreate,
    LeadDetailOut,
    LeadNoteCreate,
    LeadNoteOut,
    LeadStatus,
    LeadSummaryRow,
    LeadUpdate,
)
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadConfirmation, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def submit_lead(
    request: Request,
    body: LeadCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> LeadConfirmation:
    # Honeypot anti-spam: si un bot llenó el campo oculto 'website', responder éxito silencioso sin guardar
    if body.website.strip():
        return LeadConfirmation()

    lead = lead_service.create_lead(db, body, get_real_client_ip(request))
    background_tasks.add_task(
        lead_service.notify_lead_telegram,
        lead.name,
        lead.email,
        lead.phone,
        lead.message,
        lead.source,
        lead.service_category,
        lead.subcategory,
        lead.modality,
        lead.estimated_budget,
    )
    return LeadConfirmation()


@router.get("", response_model=list[LeadAdminOut])
def list_leads_admin(
    category: LeadCategory | None = None,
    lead_status: LeadStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[LeadAdminOut]:
    return lead_service.list_leads(
        db,
        category=category,
        status=lead_status,
        q=q,
        limit=limit,
        offset=offset,
    )


@router.get("/summary", response_model=list[LeadSummaryRow])
def get_leads_summary_admin(
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[LeadSummaryRow]:
    return lead_service.get_leads_summary(db)


@router.get("/{lead_id}", response_model=LeadDetailOut)
def get_lead_detail_admin(
    lead_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> LeadDetailOut:
    lead = lead_service.get_lead_detail(db, lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado.",
        )
    return lead


@router.patch("/{lead_id}", response_model=LeadAdminOut)
def update_lead_admin(
    lead_id: int,
    body: LeadUpdate,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> LeadAdminOut:
    updated = lead_service.update_lead(db, lead_id, body)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado.",
        )
    return updated


@router.get("/{lead_id}/notes", response_model=list[LeadNoteOut])
def list_lead_notes_admin(
    lead_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[LeadNoteOut]:
    notes = lead_service.list_lead_notes(db, lead_id)
    if notes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado.",
        )
    return [LeadNoteOut.model_validate(n) for n in notes]


@router.post("/{lead_id}/notes", response_model=LeadNoteOut, status_code=status.HTTP_201_CREATED)
def add_lead_note_admin(
    lead_id: int,
    body: LeadNoteCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> LeadNoteOut:
    note = lead_service.add_lead_note(db, lead_id, admin.id, body)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado.",
        )
    return LeadNoteOut.model_validate(note)


@router.delete("/{lead_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead_note_admin(
    lead_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> Response:
    deleted = lead_service.delete_lead_note(db, lead_id, note_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada para este lead.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
