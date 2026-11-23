import datetime as dt
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    message: str = Field(min_length=5, max_length=2000)
    source: str = Field(default="landing", max_length=64)
    # Campo honeypot invisible: los usuarios reales lo dejan vacío; los bots suelen llenarlo
    website: str = Field(default="", max_length=120)


class LeadConfirmation(BaseModel):
    received: bool = True
    message: str = "Gracias por escribirnos. Te contactaremos pronto."


class LeadAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None
    message: str
    source: str
    created_at: dt.datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UploadResponse(BaseModel):
    filename: str
    url: str
    size_bytes: int
