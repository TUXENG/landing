import datetime as dt
import html
from typing import Any

import httpx
from sqlalchemy import case, func, or_, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_client_ip
from app.models.entities import Lead, LeadNote
from app.schemas.schemas import (
    LeadAdminOut,
    LeadCreate,
    LeadDetailOut,
    LeadNoteCreate,
    LeadNoteOut,
    LeadSummaryRow,
    LeadUpdate,
)

CATEGORY_LABELS: dict[str, str] = {
    "desarrollo": "Desarrollo y Proyectos",
    "soporte": "Soporte Técnico",
    "academia": "Academia / Clases",
    "general": "General",
}

MODALITY_LABELS: dict[str, str] = {
    "presencial": "Presencial",
    "remoto": "Remoto",
    "hibrido": "Híbrido",
}


def _is_postgres(db: Session) -> bool:
    return db.bind is not None and db.bind.dialect.name == "postgresql"


def _clean_optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def create_lead(db: Session, data: LeadCreate, client_ip: str) -> Lead:
    lead = Lead(
        name=data.name.strip(),
        email=str(data.email).strip().lower(),
        phone=_clean_optional_str(data.phone),
        service_category=data.service_category,
        subcategory=_clean_optional_str(data.subcategory),
        modality=data.modality,
        estimated_budget=_clean_optional_str(data.estimated_budget),
        message=data.message.strip(),
        source=data.source.strip() or "landing",
        ip_hash=hash_client_ip(client_ip),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def notify_lead_telegram(
    name: str,
    email: str,
    phone: str | None,
    message: str,
    source: str,
    service_category: str = "general",
    subcategory: str | None = None,
    modality: str | None = None,
    estimated_budget: str | None = None,
) -> None:
    """Envía aviso en segundo plano por Telegram si TELEGRAM_LEADS_ENABLED=true."""
    if not settings.telegram_leads_enabled:
        return
    if not settings.telegram_leads_bot_token or not settings.telegram_leads_chat_id:
        return

    e = html.escape
    category_label = CATEGORY_LABELS.get(service_category, service_category)
    lines = [
        f"<b>[NUEVO LEAD] {e(settings.app_name)}</b>",
        f"• <b>Categoría:</b> {e(category_label)}",
    ]
    if subcategory:
        lines.append(f"• <b>Subcategoría:</b> {e(subcategory)}")
    if modality:
        lines.append(f"• <b>Modalidad:</b> {e(MODALITY_LABELS.get(modality, modality))}")
    if estimated_budget:
        lines.append(f"• <b>Presupuesto:</b> {e(estimated_budget)}")
    lines.extend(
        [
            f"• <b>Nombre:</b> {e(name)}",
            f"• <b>Correo:</b> {e(email)}",
            f"• <b>Teléfono:</b> {e(phone or '-')}",
            f"• <b>Origen:</b> {e(source)}",
            f"• <b>Mensaje:</b> {e(message[:600])}",
        ]
    )

    url = f"https://api.telegram.org/bot{settings.telegram_leads_bot_token}/sendMessage"
    try:
        httpx.post(
            url,
            json={
                "chat_id": settings.telegram_leads_chat_id,
                "text": "\n".join(lines),
                "parse_mode": "HTML",
            },
            timeout=8.0,
        )
    except Exception:
        # Nunca romper el flujo del usuario por un error transitorio de Telegram
        pass


def _build_lead_admin_out(lead: Lead, notes: list[LeadNote]) -> LeadAdminOut:
    latest = notes[0] if notes else None
    return LeadAdminOut(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        service_category=lead.service_category,
        subcategory=lead.subcategory,
        modality=lead.modality,
        estimated_budget=lead.estimated_budget,
        message=lead.message,
        source=lead.source,
        status=lead.status,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        notes_count=len(notes),
        last_note=latest.note if latest else None,
        last_note_at=latest.created_at if latest else None,
    )


def list_leads(
    db: Session,
    *,
    category: str | None = None,
    status: str | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[LeadAdminOut]:
    clean_q = q.strip() if q else None

    if _is_postgres(db):
        conditions: list[str] = []
        params: dict[str, Any] = {"limit": limit, "offset": offset}

        if category:
            conditions.append("l.service_category = :category")
            params["category"] = category
        if status:
            conditions.append("l.status = :status")
            params["status"] = status
        if clean_q:
            conditions.append(
                "l.search_vector @@ plainto_tsquery('public.spanish_unaccent', :q)"
            )
            params["q"] = clean_q

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = text(
            f"""
            SELECT
                v.id,
                v.name,
                v.email,
                v.phone,
                v.service_category,
                v.subcategory,
                v.modality,
                v.estimated_budget,
                l.message,
                v.source,
                v.status,
                v.created_at,
                v.updated_at,
                v.notes_count,
                v.last_note,
                v.last_note_at
            FROM v_leads_overview v
            JOIN leads l ON l.id = v.id
            {where_clause}
            ORDER BY v.updated_at DESC, v.id DESC
            LIMIT :limit OFFSET :offset
            """
        )
        rows = db.execute(sql, params).mappings().all()
        return [LeadAdminOut.model_validate(dict(row)) for row in rows]

    # Fallback compatible con SQLite (pytest)
    query = db.query(Lead)
    if category:
        query = query.filter(Lead.service_category == category)
    if status:
        query = query.filter(Lead.status == status)
    if clean_q:
        pattern = f"%{clean_q}%"
        query = query.filter(
            or_(
                Lead.name.ilike(pattern),
                Lead.email.ilike(pattern),
                Lead.subcategory.ilike(pattern),
                Lead.message.ilike(pattern),
            )
        )

    leads = (
        query.order_by(Lead.updated_at.desc(), Lead.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    if not leads:
        return []

    lead_ids = [lead.id for lead in leads]
    notes_rows = (
        db.query(LeadNote)
        .filter(LeadNote.lead_id.in_(lead_ids))
        .order_by(LeadNote.created_at.desc(), LeadNote.id.desc())
        .all()
    )
    notes_by_lead: dict[int, list[LeadNote]] = {lid: [] for lid in lead_ids}
    for note in notes_rows:
        notes_by_lead[note.lead_id].append(note)

    return [_build_lead_admin_out(lead, notes_by_lead[lead.id]) for lead in leads]


def get_leads_summary(db: Session) -> list[LeadSummaryRow]:
    if _is_postgres(db):
        rows = (
            db.execute(
                text(
                    """
                    SELECT
                        service_category,
                        nuevos,
                        contactados,
                        en_proceso,
                        cerrados,
                        archivados,
                        total
                    FROM v_leads_summary_pivot
                    ORDER BY service_category
                    """
                )
            )
            .mappings()
            .all()
        )
        return [LeadSummaryRow.model_validate(dict(row)) for row in rows]

    # Fallback compatible con SQLite (pytest)
    rows = (
        db.query(
            Lead.service_category.label("service_category"),
            func.sum(case((Lead.status == "nuevo", 1), else_=0)).label("nuevos"),
            func.sum(case((Lead.status == "contactado", 1), else_=0)).label("contactados"),
            func.sum(case((Lead.status == "en_proceso", 1), else_=0)).label("en_proceso"),
            func.sum(case((Lead.status == "cerrado", 1), else_=0)).label("cerrados"),
            func.sum(case((Lead.status == "archivado", 1), else_=0)).label("archivados"),
            func.count(Lead.id).label("total"),
        )
        .group_by(Lead.service_category)
        .order_by(Lead.service_category)
        .all()
    )
    return [
        LeadSummaryRow(
            service_category=row.service_category,
            nuevos=int(row.nuevos or 0),
            contactados=int(row.contactados or 0),
            en_proceso=int(row.en_proceso or 0),
            cerrados=int(row.cerrados or 0),
            archivados=int(row.archivados or 0),
            total=int(row.total or 0),
        )
        for row in rows
    ]


def get_lead_detail(db: Session, lead_id: int) -> LeadDetailOut | None:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        return None

    notes = (
        db.query(LeadNote)
        .filter(LeadNote.lead_id == lead_id)
        .order_by(LeadNote.created_at.desc(), LeadNote.id.desc())
        .all()
    )
    summary = _build_lead_admin_out(lead, notes)
    return LeadDetailOut(
        **summary.model_dump(),
        notes=[LeadNoteOut.model_validate(n) for n in notes],
    )


def update_lead(db: Session, lead_id: int, data: LeadUpdate) -> LeadAdminOut | None:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field in ("phone", "subcategory", "estimated_budget"):
        if field in updates:
            updates[field] = _clean_optional_str(updates[field])

    for field, value in updates.items():
        if field in ("status", "service_category") and value is None:
            continue
        setattr(lead, field, value)

    if not _is_postgres(db):
        lead.updated_at = dt.datetime.now(dt.UTC)

    db.commit()
    db.refresh(lead)

    notes = (
        db.query(LeadNote)
        .filter(LeadNote.lead_id == lead_id)
        .order_by(LeadNote.created_at.desc(), LeadNote.id.desc())
        .all()
    )
    return _build_lead_admin_out(lead, notes)


def list_lead_notes(db: Session, lead_id: int) -> list[LeadNote] | None:
    exists = db.query(Lead.id).filter(Lead.id == lead_id).first()
    if exists is None:
        return None
    return (
        db.query(LeadNote)
        .filter(LeadNote.lead_id == lead_id)
        .order_by(LeadNote.created_at.desc(), LeadNote.id.desc())
        .all()
    )


def add_lead_note(
    db: Session,
    lead_id: int,
    author_id: int,
    data: LeadNoteCreate,
) -> LeadNote | None:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead is None:
        return None

    note = LeadNote(
        lead_id=lead_id,
        author_id=author_id,
        note=data.note.strip(),
    )
    db.add(note)
    if not _is_postgres(db):
        lead.updated_at = dt.datetime.now(dt.UTC)

    db.commit()
    db.refresh(note)
    return note


def delete_lead_note(db: Session, lead_id: int, note_id: int) -> bool:
    note = (
        db.query(LeadNote)
        .filter(LeadNote.id == note_id, LeadNote.lead_id == lead_id)
        .first()
    )
    if note is None:
        return False
    db.delete(note)
    db.commit()
    return True
