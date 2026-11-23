"""Esquema inicial: content_sections, leads y admin_users.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-20 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_sections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=64), nullable=False, unique=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_content_sections_slug", "content_sections", ["slug"], unique=True)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False, server_default="landing"),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_leads_created_at", "leads", ["created_at"])

    op.create_table(
        "admin_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=180), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_admin_users_email", "admin_users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_table("admin_users")
    op.drop_table("leads")
    op.drop_table("content_sections")
