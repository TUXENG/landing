"""Script idempotente de sembrado inicial (seed) para `content_sections`.

Inserta las 6 secciones base definidas en `db-landing.md` y
`arquitectura-landing-page.md` únicamente si su `slug` aún no existe en BD,
por lo que puede ejecutarse múltiples veces sin sobrescribir cambios editados
desde el panel `/admin`.

Uso dentro del contenedor:
    docker exec landing-api python -m app.db.seed
"""

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.entities import ContentSection
from app.services.content_service import DEFAULT_SECTIONS, invalidate_content_cache

# Alias público mantenido por compatibilidad con scripts y documentación.
INITIAL_CONTENT_SECTIONS = DEFAULT_SECTIONS


def seed_content_sections(db: Session) -> tuple[int, int]:
    """Inserta únicamente las secciones faltantes. Retorna (creadas, existentes)."""
    created = 0
    skipped = 0

    for slug, data in INITIAL_CONTENT_SECTIONS.items():
        existing = db.query(ContentSection).filter(ContentSection.slug == slug).first()
        if existing is not None:
            skipped += 1
            continue

        db.add(
            ContentSection(
                slug=slug,
                title=data["title"],
                payload=data["payload"],
            )
        )
        created += 1

    if created > 0:
        db.commit()
        invalidate_content_cache()

    return created, skipped


def main() -> None:
    with SessionLocal() as db:
        created, skipped = seed_content_sections(db)
    print(f"Seed completado: {created} secciones creadas, {skipped} ya existentes.")


if __name__ == "__main__":
    main()
