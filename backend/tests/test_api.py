"""Pruebas unitarias rápidas (SQLite en memoria, sin depender de Postgres/Redis externos)."""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models.entities import AdminUser, Lead

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_health_and_default_content() -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["database"] == "ok"

    c = client.get("/api/v1/content")
    assert c.status_code == 200
    assert "hero" in c.json()
    assert "services" in c.json()


def test_lead_submission_and_honeypot() -> None:
    # Lead legítimo
    r = client.post(
        "/api/v1/leads",
        json={"name": "Ana Prueba", "email": "ana@example.com", "message": "Hola, quiero cotizar una web."},
    )
    assert r.status_code == 201
    assert r.json()["received"] is True

    # Bot llenando campo honeypot 'website' -> no debe guardarse
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
    with TestingSessionLocal() as db:
        assert db.query(Lead).count() == 1


def test_admin_login_and_content_update() -> None:
    with TestingSessionLocal() as db:
        if not db.query(AdminUser).filter(AdminUser.email == "admin@test.local").first():
            db.add(AdminUser(email="admin@test.local", password_hash=hash_password("ClaveSegura123"), is_active=True))
            db.commit()

    r_login = client.post("/api/v1/auth/login", json={"email": "admin@test.local", "password": "ClaveSegura123"})
    assert r_login.status_code == 200
    token = r_login.json()["access_token"]

    r_put = client.put(
        "/api/v1/content/hero",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hero Actualizado", "payload": {"headline": "Nuevo titular dinámico"}},
    )
    assert r_put.status_code == 200
    assert r_put.json()["payload"]["headline"] == "Nuevo titular dinámico"
