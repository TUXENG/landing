import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

LeadCategory = Literal["desarrollo", "soporte", "academia", "general"]
PortfolioCategory = Literal["desarrollo", "soporte", "academia"]
LeadModality = Literal["presencial", "remoto", "hibrido"]
LeadStatus = Literal["nuevo", "contactado", "en_proceso", "cerrado", "archivado"]


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    environment: str


class ContentSectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    payload: dict[str, Any]
    updated_at: dt.datetime | None = None


class ContentUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    payload: dict[str, Any]


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    service_category: LeadCategory = "general"
    subcategory: str | None = Field(default=None, max_length=64)
    modality: LeadModality | None = None
    estimated_budget: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=5, max_length=2000)
    source: str = Field(default="landing", max_length=64)
    # Campo honeypot invisible: los usuarios reales lo dejan vacío; los bots suelen llenarlo
    website: str = Field(default="", max_length=120)


class LeadConfirmation(BaseModel):
    received: bool = True
    message: str = "Gracias por escribirnos. Te contactaremos pronto."


class LeadUpdate(BaseModel):
    status: LeadStatus | None = None
    service_category: LeadCategory | None = None
    subcategory: str | None = Field(default=None, max_length=64)
    modality: LeadModality | None = None
    estimated_budget: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=40)


class LeadNoteCreate(BaseModel):
    note: str = Field(min_length=2, max_length=2000)


class LeadNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    author_id: int | None
    note: str
    created_at: dt.datetime


class LeadAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None
    service_category: LeadCategory
    subcategory: str | None
    modality: LeadModality | None
    estimated_budget: str | None
    message: str
    source: str
    status: LeadStatus
    created_at: dt.datetime
    updated_at: dt.datetime
    notes_count: int = 0
    last_note: str | None = None
    last_note_at: dt.datetime | None = None


class LeadDetailOut(LeadAdminOut):
    notes: list[LeadNoteOut] = Field(default_factory=list)


class LeadSummaryRow(BaseModel):
    service_category: LeadCategory
    nuevos: int
    contactados: int
    en_proceso: int
    cerrados: int
    archivados: int
    total: int


class PortfolioItemCreate(BaseModel):
    category: PortfolioCategory
    title: str = Field(min_length=3, max_length=160)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=180,
        pattern=r"^[a-z0-9-]+$",
    )
    client_label: str | None = Field(default=None, max_length=120)
    description: str = Field(min_length=10, max_length=4000)
    tech_tags: list[str] = Field(default_factory=list, max_length=15)
    image_url: str = Field(min_length=1, max_length=255)
    before_image_url: str | None = Field(default=None, max_length=255)
    demo_url: str | None = Field(default=None, max_length=255)
    video_url: str | None = Field(default=None, max_length=255)
    is_featured: bool = False
    sort_order: int = 0
    is_published: bool = True


class PortfolioItemUpdate(BaseModel):
    category: PortfolioCategory | None = None
    title: str | None = Field(default=None, min_length=3, max_length=160)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=180,
        pattern=r"^[a-z0-9-]+$",
    )
    client_label: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=4000)
    tech_tags: list[str] | None = Field(default=None, max_length=15)
    image_url: str | None = Field(default=None, min_length=1, max_length=255)
    before_image_url: str | None = Field(default=None, max_length=255)
    demo_url: str | None = Field(default=None, max_length=255)
    video_url: str | None = Field(default=None, max_length=255)
    is_featured: bool | None = None
    sort_order: int | None = None
    is_published: bool | None = None


class PortfolioItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: PortfolioCategory
    title: str
    slug: str | None
    client_label: str | None
    description: str
    tech_tags: list[str]
    image_url: str
    before_image_url: str | None
    demo_url: str | None
    video_url: str | None
    is_featured: bool
    sort_order: int
    is_published: bool
    created_at: dt.datetime
    updated_at: dt.datetime


class TestimonialCreate(BaseModel):
    category: LeadCategory
    client_name: str = Field(min_length=2, max_length=120)
    client_role: str | None = Field(default=None, max_length=120)
    company_or_institution: str | None = Field(default=None, max_length=120)
    comment: str = Field(min_length=10, max_length=2000)
    rating: int = Field(default=5, ge=1, le=5)
    avatar_url: str | None = Field(default=None, max_length=255)
    sort_order: int = 0
    is_published: bool = True


class TestimonialUpdate(BaseModel):
    category: LeadCategory | None = None
    client_name: str | None = Field(default=None, min_length=2, max_length=120)
    client_role: str | None = Field(default=None, max_length=120)
    company_or_institution: str | None = Field(default=None, max_length=120)
    comment: str | None = Field(default=None, min_length=10, max_length=2000)
    rating: int | None = Field(default=None, ge=1, le=5)
    avatar_url: str | None = Field(default=None, max_length=255)
    sort_order: int | None = None
    is_published: bool | None = None


class TestimonialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: LeadCategory
    client_name: str
    client_role: str | None
    company_or_institution: str | None
    comment: str
    rating: int
    avatar_url: str | None
    sort_order: int
    is_published: bool
    created_at: dt.datetime
    updated_at: dt.datetime


class LoginRequest(BaseModel):
    # Permite dominios internos como admin@tuxserver.local además de correos públicos estándar.
    email: str = Field(min_length=3, max_length=180, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminMeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    is_active: bool


class UploadResponse(BaseModel):
    filename: str
    url: str
    size_bytes: int
