import html
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_client_ip
from app.models.entities import Lead
from app.schemas.schemas import LeadCreate


def create_lead(db: Session, data: LeadCreate, client_ip: str) -> Lead:
    lead = Lead(
        name=data.name.strip(),
        email=str(data.email).strip().lower(),
        phone=data.phone.strip() if data.phone else None,
        message=data.message.strip(),
        source=data.source.strip() or "landing",
        ip_hash=hash_client_ip(client_ip),
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def notify_lead_telegram(name: str, email: str, phone: str | None, message: str, source: str) -> None:
    """Envía aviso en segundo plano por Telegram si TELEGRAM_LEADS_ENABLED=true."""
    if not settings.telegram_leads_enabled:
        return
    if not settings.telegram_leads_bot_token or not settings.telegram_leads_chat_id:
        return

    e = html.escape
    text = (
        f"<b>[NUEVO LEAD] {e(settings.app_name)}</b>\n"
        f"• <b>Nombre:</b> {e(name)}\n"
        f"• <b>Correo:</b> {e(email)}\n"
        f"• <b>Teléfono:</b> {e(phone or '-')}\n"
        f"• <b>Origen:</b> {e(source)}\n"
        f"• <b>Mensaje:</b> {e(message[:600])}"
    )
    url = f"https://api.telegram.org/bot{settings.telegram_leads_bot_token}/sendMessage"
    try:
        httpx.post(
            url,
            json={"chat_id": settings.telegram_leads_chat_id, "text": text, "parse_mode": "HTML"},
            timeout=8.0,
        )
    except Exception:
        # Nunca romper el flujo del usuario por un error transitorio de Telegram
        pass
