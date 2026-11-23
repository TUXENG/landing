import json
from typing import Any

from sqlalchemy.orm import Session

from app.db.redis import get_redis_client
from app.models.entities import ContentSection

CACHE_KEY = "landing:content:v1"
CACHE_TTL_SEC = 600

DEFAULT_SECTIONS: dict[str, dict[str, Any]] = {
    "hero": {
        "title": "Soluciones Digitales y Automatización a Medida",
        "payload": {
            "badge": "Disponible para nuevos proyectos",
            "headline": "Construimos software, infraestructura y automatizaciones que escalan tu negocio",
            "subheadline": "Desde páginas web ultrarrápidas y APIs modernas hasta servidores propios, respaldos seguros y bots de WhatsApp.",
            "cta_primary": "Solicitar cotización",
            "cta_secondary": "Ver servicios",
        },
    },
    "services": {
        "title": "Servicios Principales",
        "payload": {
            "items": [
                {
                    "title": "Desarrollo Web & APIs",
                    "description": "Aplicaciones modernas con React, TypeScript, FastAPI y PostgreSQL optimizadas para velocidad.",
                },
                {
                    "title": "Automatización y Bots",
                    "description": "Integraciones con WhatsApp, Telegram, ERP y flujos automáticos para ahorrar horas operativas.",
                },
                {
                    "title": "Infraestructura Linux & Docker",
                    "description": "Servidores Ubuntu seguros, RAID, monitoreo proactivo y respaldos cifrados verificados.",
                },
            ]
        },
    },
    "faq": {
        "title": "Preguntas Frecuentes",
        "payload": {
            "items": [
                {
                    "q": "¿Cuánto tarda un proyecto típico?",
                    "a": "Una landing dinámica o integración inicial suele entregarse entre 1 y 3 semanas según el alcance.",
                },
                {
                    "q": "¿Puedo editar los textos e imágenes después?",
                    "a": "Sí, incluye un panel administrador ligero en /admin para actualizar contenido sin tocar código.",
                },
            ]
        },
    },
}


def invalidate_content_cache() -> None:
    client = get_redis_client()
    if client is not None:
        try:
            client.delete(CACHE_KEY)
        except Exception:
            pass


def get_all_content(db: Session) -> dict[str, dict[str, Any]]:
    client = get_redis_client()
    if client is not None:
        try:
            cached = client.get(CACHE_KEY)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    rows = db.query(ContentSection).all()
    merged: dict[str, dict[str, Any]] = {
        slug: {"slug": slug, "title": data["title"], "payload": data["payload"], "updated_at": None}
        for slug, data in DEFAULT_SECTIONS.items()
    }
    for row in rows:
        merged[row.slug] = {
            "slug": row.slug,
            "title": row.title,
            "payload": row.payload,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }

    if client is not None:
        try:
            client.setex(CACHE_KEY, CACHE_TTL_SEC, json.dumps(merged))
        except Exception:
            pass

    return merged


def upsert_section(db: Session, slug: str, title: str, payload: dict[str, Any]) -> ContentSection:
    row = db.query(ContentSection).filter(ContentSection.slug == slug).first()
    if row is None:
        row = ContentSection(slug=slug, title=title, payload=payload)
        db.add(row)
    else:
        row.title = title
        row.payload = payload
    db.commit()
    db.refresh(row)
    invalidate_content_cache()
    return row
