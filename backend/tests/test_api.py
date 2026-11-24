"""Pruebas unitarias rápidas (SQLite en memoria, sin depender de Postgres/Redis externos)."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models.entities import AdminUser, Lead

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
limiter.enabled = False
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_database() -> None:
    """Reinicia las tablas entre pruebas para mantener aislamiento total."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _create_admin_and_get_token(email: str = "Admin@Test.Local", password: str = "ClaveSegura123") -> str:
    with TestingSessionLocal() as db:
        db.add(
            AdminUser(
                email=email,
                password_hash=hash_password(password),
                is_active=True,
            )
        )
        db.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email.lower(), "password": password},
    )
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_health_and_default_content() -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["database"] == "ok"

    c = client.get("/api/v1/content")
    assert c.status_code == 200
    body = c.json()
    for slug in ("hero", "tab_desarrollo", "tab_soporte", "tab_academia", "faq", "contact_channels"):
        assert slug in body


def test_auth_case_insensitive_login_and_me() -> None:
    # Sin token -> 401
    r_unauth = client.get("/api/v1/auth/me")
    assert r_unauth.status_code == 401

    token = _create_admin_and_get_token(email="Admin@Test.Local")
    r_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "Admin@Test.Local"
    assert r_me.json()["is_active"] is True


def test_admin_content_update() -> None:
    token = _create_admin_and_get_token()
    r_put = client.put(
        "/api/v1/content/hero",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hero Actualizado", "payload": {"title": "Nuevo titular dinámico"}},
    )
    assert r_put.status_code == 200
    assert r_put.json()["payload"]["title"] == "Nuevo titular dinámico"


def test_lead_submission_honeypot_and_validation() -> None:
    # Lead legítimo con categoría, subcategoría y modalidad
    r = client.post(
        "/api/v1/leads",
        json={
            "name": "Ana Prueba",
            "email": "ana@example.com",
            "phone": "+57 300 111 2233",
            "service_category": "desarrollo",
            "subcategory": "App Android Kotlin",
            "modality": "remoto",
            "estimated_budget": "$2M - $4M COP",
            "message": "Hola, quiero cotizar una aplicación móvil en Kotlin.",
        },
    )
    assert r.status_code == 201
    assert r.json()["received"] is True

    # Bot llenando campo honeypot 'website' -> éxito silencioso sin guardar
    r_bot = client.post(
        "/api/v1/leads",
        json={
            "name": "Bot Spam",
            "email": "bot@spam.example",
            "message": "Compra barato ahora mismo",
            "website": "http://spam.example",
        },
    )
    assert r_bot.status_code == 201

    # Categoría inválida -> 422
    r_invalid = client.post(
        "/api/v1/leads",
        json={
            "name": "Carlos Invalido",
            "email": "carlos@example.com",
            "service_category": "inexistente",
            "message": "Mensaje de prueba con categoría inválida.",
        },
    )
    assert r_invalid.status_code == 422

    with TestingSessionLocal() as db:
        leads = db.query(Lead).all()
        assert len(leads) == 1
        assert leads[0].service_category == "desarrollo"
        assert leads[0].subcategory == "App Android Kotlin"
        assert leads[0].modality == "remoto"


def test_leads_crm_filters_summary_patch_and_notes() -> None:
    token = _create_admin_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Crear 2 leads en distintas categorías
    client.post(
        "/api/v1/leads",
        json={
            "name": "Laura Dev",
            "email": "laura@empresa.com",
            "service_category": "desarrollo",
            "subcategory": "Web App",
            "modality": "remoto",
            "message": "Necesitamos un sistema de facturación web con FastAPI.",
        },
    )
    client.post(
        "/api/v1/leads",
        json={
            "name": "Pedro Soporte",
            "email": "pedro@hogar.com",
            "service_category": "soporte",
            "subcategory": "Laptop",
            "modality": "presencial",
            "message": "Mi portátil no enciende después de una sobrecarga.",
        },
    )

    # Filtro por categoría y búsqueda ?q=
    r_dev = client.get("/api/v1/leads?category=desarrollo&q=facturación", headers=headers)
    assert r_dev.status_code == 200
    items = r_dev.json()
    assert len(items) == 1
    lead_id = items[0]["id"]
    assert items[0]["notes_count"] == 0

    # PATCH estado del lead
    r_patch = client.patch(
        f"/api/v1/leads/{lead_id}",
        headers=headers,
        json={"status": "en_proceso", "estimated_budget": "$5M COP"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["status"] == "en_proceso"
    assert r_patch.json()["estimated_budget"] == "$5M COP"

    # Filtro por status
    r_status = client.get("/api/v1/leads?status=en_proceso", headers=headers)
    assert r_status.status_code == 200
    assert len(r_status.json()) == 1
    assert r_status.json()[0]["id"] == lead_id

    # Summary pivot
    r_summary = client.get("/api/v1/leads/summary", headers=headers)
    assert r_summary.status_code == 200
    summary_by_cat = {row["service_category"]: row for row in r_summary.json()}
    assert summary_by_cat["desarrollo"]["en_proceso"] == 1
    assert summary_by_cat["desarrollo"]["total"] == 1
    assert summary_by_cat["soporte"]["nuevos"] == 1

    # CRUD de notas
    r_note = client.post(
        f"/api/v1/leads/{lead_id}/notes",
        headers=headers,
        json={"note": "Llamado el lunes: enviamos cotización preliminar."},
    )
    assert r_note.status_code == 201
    note_id = r_note.json()["id"]
    assert r_note.json()["author_id"] is not None

    r_notes = client.get(f"/api/v1/leads/{lead_id}/notes", headers=headers)
    assert r_notes.status_code == 200
    assert len(r_notes.json()) == 1

    # Detalle del lead incluye historial de notas y conteo
    r_detail = client.get(f"/api/v1/leads/{lead_id}", headers=headers)
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert detail["notes_count"] == 1
    assert detail["last_note"] == "Llamado el lunes: enviamos cotización preliminar."
    assert len(detail["notes"]) == 1

    # Eliminar nota
    r_del_note = client.delete(f"/api/v1/leads/{lead_id}/notes/{note_id}", headers=headers)
    assert r_del_note.status_code == 204
    r_notes_after = client.get(f"/api/v1/leads/{lead_id}/notes", headers=headers)
    assert r_notes_after.json() == []


def test_portfolio_crud_filters_auth_and_duplicate_slug() -> None:
    # Crear sin JWT -> 401
    r_no_auth = client.post(
        "/api/v1/portfolio",
        json={
            "category": "desarrollo",
            "title": "Dashboard IoT",
            "description": "Plataforma en tiempo real con ESP32 y FastAPI.",
            "image_url": "/uploads/demo.webp",
        },
    )
    assert r_no_auth.status_code == 401

    token = _create_admin_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Crear proyecto publicado y destacado
    r_pub = client.post(
        "/api/v1/portfolio",
        headers=headers,
        json={
            "category": "desarrollo",
            "title": "Dashboard IoT ESP32",
            "slug": "dashboard-iot-esp32",
            "description": "Monitoreo industrial con ESP32, MQTT y React.",
            "tech_tags": ["React", "FastAPI", "ESP32"],
            "image_url": "/uploads/iot.webp",
            "is_featured": True,
            "is_published": True,
        },
    )
    assert r_pub.status_code == 201
    pub_id = r_pub.json()["id"]

    # Slug duplicado -> 409 Conflict
    r_dup = client.post(
        "/api/v1/portfolio",
        headers=headers,
        json={
            "category": "desarrollo",
            "title": "Otro Proyecto",
            "slug": "dashboard-iot-esp32",
            "description": "Proyecto duplicado para probar restricción UNIQUE.",
            "image_url": "/uploads/dup.webp",
        },
    )
    assert r_dup.status_code == 409

    # Crear borrador (is_published=False)
    r_draft = client.post(
        "/api/v1/portfolio",
        headers=headers,
        json={
            "category": "soporte",
            "title": "Reparación placa portátil",
            "slug": "reparacion-placa-hp",
            "description": "Cambio de MOSFET en corto y limpieza ultrasónica.",
            "tech_tags": ["Electrónica", "SMD"],
            "image_url": "/uploads/after.webp",
            "before_image_url": "/uploads/before.webp",
            "is_published": False,
        },
    )
    assert r_draft.status_code == 201
    draft_id = r_draft.json()["id"]

    # Público solo ve publicados
    r_list_pub = client.get("/api/v1/portfolio")
    assert r_list_pub.status_code == 200
    assert [item["id"] for item in r_list_pub.json()] == [pub_id]

    # Filtro ?tag=
    r_tag = client.get("/api/v1/portfolio?tag=ESP32")
    assert r_tag.status_code == 200
    assert len(r_tag.json()) == 1
    assert client.get("/api/v1/portfolio?tag=Kotlin").json() == []

    # Admin ve publicados y borradores
    r_list_admin = client.get("/api/v1/portfolio/admin", headers=headers)
    assert r_list_admin.status_code == 200
    assert len(r_list_admin.json()) == 2

    # PATCH publicar borrador
    r_patch = client.patch(
        f"/api/v1/portfolio/{draft_id}",
        headers=headers,
        json={"is_published": True, "sort_order": 5},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["is_published"] is True
    assert r_patch.json()["sort_order"] == 5

    # DELETE
    r_del = client.delete(f"/api/v1/portfolio/{pub_id}", headers=headers)
    assert r_del.status_code == 204
    assert client.delete(f"/api/v1/portfolio/{pub_id}", headers=headers).status_code == 404


def test_testimonials_crud_and_validation() -> None:
    token = _create_admin_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Rating inválido (6) -> 422
    r_bad = client.post(
        "/api/v1/testimonials",
        headers=headers,
        json={
            "category": "academia",
            "client_name": "Mateo Estudiante",
            "comment": "Excelente explicación de microcontroladores y lógica.",
            "rating": 6,
        },
    )
    assert r_bad.status_code == 422

    # Publicado y borrador
    r_pub = client.post(
        "/api/v1/testimonials",
        headers=headers,
        json={
            "category": "academia",
            "client_name": "Mateo Estudiante",
            "client_role": "Estudiante Ing. Electrónica",
            "comment": "Las tutorías de ESP32 fueron súper claras y prácticas.",
            "rating": 5,
            "sort_order": 1,
            "is_published": True,
        },
    )
    assert r_pub.status_code == 201
    pub_id = r_pub.json()["id"]

    r_draft = client.post(
        "/api/v1/testimonials",
        headers=headers,
        json={
            "category": "soporte",
            "client_name": "Sofía Gómez",
            "comment": "Recuperaron mi portátil el mismo día con fotos del proceso.",
            "rating": 5,
            "is_published": False,
        },
    )
    assert r_draft.status_code == 201
    draft_id = r_draft.json()["id"]

    # Público solo ve publicados
    r_public = client.get("/api/v1/testimonials")
    assert r_public.status_code == 200
    assert [item["id"] for item in r_public.json()] == [pub_id]

    # Filtro por categoría
    assert len(client.get("/api/v1/testimonials?category=academia").json()) == 1
    assert client.get("/api/v1/testimonials?category=soporte").json() == []

    # Admin ve ambos
    r_admin = client.get("/api/v1/testimonials/admin", headers=headers)
    assert r_admin.status_code == 200
    assert len(r_admin.json()) == 2

    # PATCH y DELETE
    r_patch = client.patch(
        f"/api/v1/testimonials/{draft_id}",
        headers=headers,
        json={"is_published": True, "rating": 4},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["rating"] == 4
    assert r_patch.json()["is_published"] is True

    r_del = client.delete(f"/api/v1/testimonials/{pub_id}", headers=headers)
    assert r_del.status_code == 204


def test_uploads_magic_bytes_validation(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    token = _create_admin_and_get_token()
    headers = {"Authorization": f"Bearer {token}"}

    # PNG válido (firma real)
    valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
    r_png = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("captura.png", valid_png, "image/png")},
    )
    assert r_png.status_code == 201
    assert r_png.json()["filename"].endswith(".png")
    assert (tmp_path / r_png.json()["filename"]).exists()

    # WebP válido (RIFF....WEBP)
    valid_webp = b"RIFF\x24\x00\x00\x00WEBP" + b"\x00" * 16
    r_webp = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("foto.webp", valid_webp, "image/webp")},
    )
    assert r_webp.status_code == 201
    assert r_webp.json()["filename"].endswith(".webp")

    # Archivo falso con header image/png pero contenido de texto -> 400
    r_fake = client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("falso.png", b"esto no es una imagen png", "image/png")},
    )
    assert r_fake.status_code == 400
