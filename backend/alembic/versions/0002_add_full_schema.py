"""Esquema completo landing_db: 6 tablas, índices avanzados, triggers y vistas.

Revision ID: 0002_add_full_schema
Revises: 0001_initial
Create Date: 2026-11-24 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_add_full_schema"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. content_sections: JSON -> JSONB y eliminar índice duplicado en slug
    # -------------------------------------------------------------------------
    op.alter_column(
        "content_sections",
        "payload",
        existing_type=sa.JSON(),
        type_=postgresql.JSONB(),
        postgresql_using="payload::jsonb",
        existing_nullable=False,
    )
    op.drop_index("ix_content_sections_slug", table_name="content_sections")

    # -------------------------------------------------------------------------
    # 2. admin_users: unicidad case-insensitive con índice funcional LOWER()
    # -------------------------------------------------------------------------
    op.drop_index("ix_admin_users_email", table_name="admin_users")
    op.drop_constraint("admin_users_email_key", "admin_users", type_="unique")
    op.execute(
        "CREATE UNIQUE INDEX idx_admin_users_email_lower "
        "ON admin_users (LOWER(email));"
    )

    # -------------------------------------------------------------------------
    # 3. leads: nuevas columnas, checks, search_vector (TSVECTOR) e índices
    # -------------------------------------------------------------------------
    op.add_column(
        "leads",
        sa.Column(
            "service_category",
            sa.String(length=32),
            nullable=False,
            server_default="general",
        ),
    )
    op.add_column(
        "leads", sa.Column("subcategory", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "leads", sa.Column("modality", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "leads", sa.Column("estimated_budget", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "leads",
        sa.Column(
            "status",
            sa.String(length=24),
            nullable=False,
            server_default="nuevo",
        ),
    )
    op.add_column(
        "leads",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_check_constraint(
        "ck_leads_service_category",
        "leads",
        "service_category IN ('desarrollo', 'soporte', 'academia', 'general')",
    )
    op.create_check_constraint(
        "ck_leads_modality",
        "leads",
        "modality IS NULL OR modality IN ('presencial', 'remoto', 'hibrido')",
    )
    op.create_check_constraint(
        "ck_leads_status",
        "leads",
        "status IN ('nuevo', 'contactado', 'en_proceso', 'cerrado', 'archivado')",
    )

    # Columna generada STORED para búsqueda full-text en español
    op.execute(
        """
        ALTER TABLE leads
        ADD COLUMN search_vector TSVECTOR GENERATED ALWAYS AS (
            to_tsvector(
                'spanish',
                coalesce(name, '') || ' ' ||
                coalesce(email, '') || ' ' ||
                coalesce(subcategory, '') || ' ' ||
                coalesce(message, '')
            )
        ) STORED;
        """
    )

    op.drop_index("ix_leads_created_at", table_name="leads")
    op.create_index(
        "idx_leads_category_status", "leads", ["service_category", "status"]
    )
    op.execute(
        """
        CREATE INDEX idx_leads_active
            ON leads (created_at DESC)
            WHERE status IN ('nuevo', 'contactado', 'en_proceso');
        """
    )
    op.execute("CREATE INDEX idx_leads_search ON leads USING GIN (search_vector);")

    # -------------------------------------------------------------------------
    # 4. Tablas nuevas: portfolio_items, testimonials y lead_notes
    # -------------------------------------------------------------------------
    op.create_table(
        "portfolio_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=True, unique=True),
        sa.Column("client_label", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "tech_tags",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("image_url", sa.String(length=255), nullable=False),
        sa.Column("before_image_url", sa.String(length=255), nullable=True),
        sa.Column("demo_url", sa.String(length=255), nullable=True),
        sa.Column("video_url", sa.String(length=255), nullable=True),
        sa.Column(
            "is_featured",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "is_published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "category IN ('desarrollo', 'soporte', 'academia')",
            name="ck_portfolio_items_category",
        ),
    )
    op.execute(
        """
        CREATE INDEX idx_portfolio_public
            ON portfolio_items (category, is_featured DESC, sort_order ASC)
            WHERE is_published = TRUE;
        """
    )
    op.execute(
        "CREATE INDEX idx_portfolio_tech_tags ON portfolio_items USING GIN (tech_tags);"
    )

    op.create_table(
        "testimonials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("client_name", sa.String(length=120), nullable=False),
        sa.Column("client_role", sa.String(length=120), nullable=True),
        sa.Column("company_or_institution", sa.String(length=120), nullable=True),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("avatar_url", sa.String(length=255), nullable=True),
        sa.Column(
            "sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "is_published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "category IN ('desarrollo', 'soporte', 'academia', 'general')",
            name="ck_testimonials_category",
        ),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_testimonials_rating",
        ),
    )
    op.execute(
        """
        CREATE INDEX idx_testimonials_public
            ON testimonials (category, sort_order ASC)
            WHERE is_published = TRUE;
        """
    )

    op.create_table(
        "lead_notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "lead_id",
            sa.Integer(),
            sa.ForeignKey("leads.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            sa.Integer(),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.execute(
        "CREATE INDEX idx_lead_notes_lead_created "
        "ON lead_notes (lead_id, created_at DESC);"
    )

    # -------------------------------------------------------------------------
    # 5. Funciones PL/pgSQL y Triggers
    # -------------------------------------------------------------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_leads_updated_at
            BEFORE UPDATE ON leads
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_portfolio_items_updated_at
            BEFORE UPDATE ON portfolio_items
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_testimonials_updated_at
            BEFORE UPDATE ON testimonials
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_content_sections_updated_at
            BEFORE UPDATE ON content_sections
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION touch_lead_on_note()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE leads SET updated_at = NOW() WHERE id = NEW.lead_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_lead_notes_touch_lead
            AFTER INSERT ON lead_notes
            FOR EACH ROW EXECUTE FUNCTION touch_lead_on_note();
        """
    )

    # -------------------------------------------------------------------------
    # 6. Vistas operacionales
    # -------------------------------------------------------------------------
    op.execute(
        """
        CREATE OR REPLACE VIEW v_leads_overview AS
        SELECT
            l.id,
            l.name,
            l.email,
            l.phone,
            l.service_category,
            l.subcategory,
            l.modality,
            l.estimated_budget,
            l.source,
            l.status,
            l.created_at,
            l.updated_at,
            COALESCE(n.notes_count, 0) AS notes_count,
            n.last_note,
            n.last_note_at
        FROM leads l
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*)::INT AS notes_count,
                (ARRAY_AGG(note ORDER BY created_at DESC))[1] AS last_note,
                MAX(created_at) AS last_note_at
            FROM lead_notes
            WHERE lead_id = l.id
        ) n ON TRUE;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW v_leads_summary_pivot AS
        SELECT
            service_category,
            COUNT(*) FILTER (WHERE status = 'nuevo')      AS nuevos,
            COUNT(*) FILTER (WHERE status = 'contactado') AS contactados,
            COUNT(*) FILTER (WHERE status = 'en_proceso') AS en_proceso,
            COUNT(*) FILTER (WHERE status = 'cerrado')    AS cerrados,
            COUNT(*) FILTER (WHERE status = 'archivado')  AS archivados,
            COUNT(*)                                      AS total
        FROM leads
        GROUP BY service_category;
        """
    )


def downgrade() -> None:
    # 1. Vistas
    op.execute("DROP VIEW IF EXISTS v_leads_summary_pivot;")
    op.execute("DROP VIEW IF EXISTS v_leads_overview;")

    # 2. Triggers y funciones
    op.execute("DROP TRIGGER IF EXISTS trg_lead_notes_touch_lead ON lead_notes;")
    op.execute("DROP FUNCTION IF EXISTS touch_lead_on_note();")

    op.execute(
        "DROP TRIGGER IF EXISTS trg_content_sections_updated_at ON content_sections;"
    )
    op.execute("DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON testimonials;")
    op.execute(
        "DROP TRIGGER IF EXISTS trg_portfolio_items_updated_at ON portfolio_items;"
    )
    op.execute("DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at();")

    # 3. Tablas nuevas (lead_notes primero por sus FKs)
    op.drop_table("lead_notes")
    op.drop_table("testimonials")
    op.drop_table("portfolio_items")

    # 4. Revertir leads
    op.execute("DROP INDEX IF EXISTS idx_leads_search;")
    op.execute("DROP INDEX IF EXISTS idx_leads_active;")
    op.drop_index("idx_leads_category_status", table_name="leads")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS search_vector;")

    op.drop_constraint("ck_leads_status", "leads", type_="check")
    op.drop_constraint("ck_leads_modality", "leads", type_="check")
    op.drop_constraint("ck_leads_service_category", "leads", type_="check")

    op.drop_column("leads", "updated_at")
    op.drop_column("leads", "status")
    op.drop_column("leads", "estimated_budget")
    op.drop_column("leads", "modality")
    op.drop_column("leads", "subcategory")
    op.drop_column("leads", "service_category")
    op.create_index("ix_leads_created_at", "leads", ["created_at"])

    # 5. Revertir admin_users
    op.execute("DROP INDEX IF EXISTS idx_admin_users_email_lower;")
    op.create_unique_constraint("admin_users_email_key", "admin_users", ["email"])
    op.create_index("ix_admin_users_email", "admin_users", ["email"], unique=True)

    # 6. Revertir content_sections
    op.create_index(
        "ix_content_sections_slug", "content_sections", ["slug"], unique=True
    )
    op.alter_column(
        "content_sections",
        "payload",
        existing_type=postgresql.JSONB(),
        type_=sa.JSON(),
        postgresql_using="payload::json",
        existing_nullable=False,
    )
