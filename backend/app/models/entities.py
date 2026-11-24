"""Modelos ORM (SQLAlchemy 2.0) de la base de datos `landing_db`.

Define las 6 tablas principales especificadas en `db-landing.md`:
- ContentSection: bloques de texto y configuración editables del sitio.
- AdminUser: cuentas de acceso al panel privado `/admin`.
- Lead: solicitudes y prospectos enviados desde los formularios web.
- LeadNote: historial interno de seguimiento por cada lead (1:N).
- PortfolioItem: evidencias visuales y proyectos por pestaña.
- Testimonial: reseñas y calificaciones de clientes/estudiantes.

Nota sobre objetos exclusivos de PostgreSQL:
`leads.search_vector` (TSVECTOR generado), los índices GIN/parciales,
los triggers (`set_updated_at`, `touch_lead_on_note`) y las vistas
(`v_leads_overview`, `v_leads_summary_pivot`) se gestionan en la migración
Alembic `0002_add_full_schema.py` para mantener compatibles los tests en SQLite.
"""

import datetime as dt
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# Usa JSON estándar por defecto (compatible con SQLite en pytest) y JSONB nativo en PostgreSQL.
JSONB_TYPE = JSON().with_variant(JSONB(), "postgresql")


class ContentSection(Base):
    """Bloques dinámicos de contenido editable sin redesplegar el frontend.

    Ejemplos de `slug`: 'hero', 'tab_desarrollo', 'tab_soporte', 'tab_academia',
    'faq', 'contact_channels'.
    """

    __tablename__ = "content_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    # UNIQUE en PostgreSQL ya crea su propio índice B-Tree; no se duplica con index=True.
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    # Estructura JSONB flexible adaptada a cada sección del sitio.
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB_TYPE, nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AdminUser(Base):
    """Administradores autenticados del panel `/admin` (Argon2 + JWT)."""

    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # La unicidad sin distinguir mayúsculas/minúsculas la garantiza `idx_admin_users_email_lower`.
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # `default` aplica en Python (ORM) y `server_default` en PostgreSQL (SQL directo).
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
    )
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


# Índice único funcional: impide registrar 'Admin@...' y 'admin@...' como dos usuarios distintos.
Index("idx_admin_users_email_lower", func.lower(AdminUser.email), unique=True)


class Lead(Base):
    """Prospectos y mensajes recibidos desde los formularios de las 3 pestañas."""

    __tablename__ = "leads"
    __table_args__ = (
        # Restricciones CHECK a nivel de motor para garantizar valores válidos en toda escritura.
        CheckConstraint(
            "service_category IN ('desarrollo', 'soporte', 'academia', 'general')",
            name="ck_leads_service_category",
        ),
        CheckConstraint(
            "modality IS NULL OR modality IN ('presencial', 'remoto', 'hibrido')",
            name="ck_leads_modality",
        ),
        CheckConstraint(
            "status IN ('nuevo', 'contactado', 'en_proceso', 'cerrado', 'archivado')",
            name="ck_leads_status",
        ),
        # Acelera filtros del panel /admin por pestaña y estado del lead.
        Index("idx_leads_category_status", "service_category", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    # Opcional en BD; útil en la UI para abrir conversación directa por WhatsApp.
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    # Clasificación principal por pestaña; por defecto 'general' para compatibilidad.
    service_category: Mapped[str] = mapped_column(
        String(32),
        default="general",
        server_default="general",
        nullable=False,
    )
    # Especialidad dentro de la pestaña (ej. 'Web App', 'App Android Kotlin', 'Laptop').
    subcategory: Mapped[str | None] = mapped_column(String(64), nullable=True)
    modality: Mapped[str | None] = mapped_column(String(20), nullable=True)
    estimated_budget: Mapped[str | None] = mapped_column(String(64), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    # Canal de origen del prospecto (ej. 'landing', 'whatsapp_referral').
    source: Mapped[str] = mapped_column(
        String(64),
        default="landing",
        server_default="landing",
        nullable=False,
    )
    # Estado en el flujo CRM del panel /admin.
    status: Mapped[str] = mapped_column(
        String(24),
        default="nuevo",
        server_default="nuevo",
        nullable=False,
    )
    # Hash SHA-256 de la IP del cliente (auditoría/anti-spam sin almacenar IP en texto plano).
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    # También se actualiza automáticamente por trigger en PostgreSQL al editar o agregar notas.
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relación 1:N hacia las notas internas; borrar un lead elimina sus notas asociadas.
    notes: Mapped[list["LeadNote"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
    )


class LeadNote(Base):
    """Historial interno de seguimiento (llamadas, cotizaciones, acuerdos) de un lead."""

    __tablename__ = "lead_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    # ON DELETE CASCADE: si se elimina el lead en BD, se borran sus notas automáticamente.
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )
    # ON DELETE SET NULL: si se borra un admin, se conserva la nota histórica sin autor.
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    lead: Mapped["Lead"] = relationship(back_populates="notes")
    author: Mapped["AdminUser | None"] = relationship()


# Índice compuesto para traer rápidamente las notas más recientes de un lead (usado por v_leads_overview).
Index(
    "idx_lead_notes_lead_created",
    LeadNote.lead_id,
    LeadNote.created_at.desc(),
)


class PortfolioItem(Base):
    """Evidencias visuales y proyectos publicados en Desarrollo, Soporte o Academia."""

    __tablename__ = "portfolio_items"
    __table_args__ = (
        CheckConstraint(
            "category IN ('desarrollo', 'soporte', 'academia')",
            name="ck_portfolio_items_category",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    # URL amigable opcional (UNIQUE crea índice único implícito en PostgreSQL).
    slug: Mapped[str | None] = mapped_column(String(180), unique=True, nullable=True)
    client_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Lista JSONB de tecnologías (ej. ["React", "FastAPI", "ESP32"]); indexada con GIN en Postgres.
    tech_tags: Mapped[list[str]] = mapped_column(
        JSONB_TYPE,
        default=list,
        server_default=text("'[]'"),
        nullable=False,
    )
    # Ruta relativa de la imagen principal en `/uploads/...`.
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    # Imagen opcional del "Antes" para comparativas de reparación en la pestaña Soporte.
    before_image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Control de visibilidad y orden en la portada y galerías públicas.
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text("0"),
        nullable=False,
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
    )
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Testimonial(Base):
    """Reseñas y calificaciones (1 a 5 estrellas) de clientes y estudiantes."""

    __tablename__ = "testimonials"
    __table_args__ = (
        CheckConstraint(
            "category IN ('desarrollo', 'soporte', 'academia', 'general')",
            name="ck_testimonials_category",
        ),
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_testimonials_rating",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    client_name: Mapped[str] = mapped_column(String(120), nullable=False)
    client_role: Mapped[str | None] = mapped_column(String(120), nullable=True)
    company_or_institution: Mapped[str | None] = mapped_column(
        String(120), nullable=True
    )
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(
        Integer,
        default=5,
        server_default=text("5"),
        nullable=False,
    )
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text("0"),
        nullable=False,
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
    )
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
