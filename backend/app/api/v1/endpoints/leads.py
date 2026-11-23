from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.rate_limit import get_real_client_ip, limiter
from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.entities import AdminUser, Lead
from app.schemas.schemas import LeadAdminOut, LeadConfirmation, LeadCreate
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
    )
    return LeadConfirmation()


@router.get("", response_model=list[LeadAdminOut])
def list_leads_admin(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> list[LeadAdminOut]:
    rows = db.query(Lead).order_by(Lead.created_at.desc()).limit(limit).all()
    return [LeadAdminOut.model_validate(r) for r in rows]
