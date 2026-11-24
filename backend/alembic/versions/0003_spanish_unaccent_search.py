"""Búsqueda full-text en español insensible a tildes (unaccent + spanish_stem).

Revision ID: 0003_spanish_unaccent_search
Revises: 0002_add_full_schema
Create Date: 2026-11-24 00:00:00
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003_spanish_unaccent_search"
down_revision: Union[str, None] = "0002_add_full_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # `unaccent` es una extensión trusted en PostgreSQL 16: `landing_user` (dueño de
    # `landing_db`) puede instalarla directamente sin necesitar privilegios de superusuario.
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;")

    # Configuración de búsqueda en español que elimina tildes antes del stemmer.
    # Se califica con `public.` para que `pg_dump` / `pg_restore` (que vacían search_path)
    # puedan restaurar la columna generada sin errores.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_ts_config c
                JOIN pg_namespace n ON n.oid = c.cfgnamespace
                WHERE n.nspname = 'public' AND c.cfgname = 'spanish_unaccent'
            ) THEN
                CREATE TEXT SEARCH CONFIGURATION public.spanish_unaccent (COPY = pg_catalog.spanish);
            END IF;
        END
        $$;
        """
    )
    op.execute(
        """
        ALTER TEXT SEARCH CONFIGURATION public.spanish_unaccent
            ALTER MAPPING FOR hword, hword_part, word
            WITH public.unaccent, spanish_stem;
        """
    )

    # Recrear `search_vector` usando `public.spanish_unaccent` e índice GIN.
    op.execute("DROP INDEX IF EXISTS idx_leads_search;")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS search_vector;")
    op.execute(
        """
        ALTER TABLE leads
        ADD COLUMN search_vector TSVECTOR GENERATED ALWAYS AS (
            to_tsvector(
                'public.spanish_unaccent',
                coalesce(name, '') || ' ' ||
                coalesce(email, '') || ' ' ||
                coalesce(subcategory, '') || ' ' ||
                coalesce(message, '')
            )
        ) STORED;
        """
    )
    op.execute("CREATE INDEX idx_leads_search ON leads USING GIN (search_vector);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_leads_search;")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS search_vector;")
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
    op.execute("CREATE INDEX idx_leads_search ON leads USING GIN (search_vector);")
    op.execute("DROP TEXT SEARCH CONFIGURATION IF EXISTS public.spanish_unaccent;")
