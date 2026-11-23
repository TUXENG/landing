# Landing Page Dinámica — React (Vite) + FastAPI + PostgreSQL + Redis

Monorepo base adaptado a **`tuxserver`** (`/mnt/raid/docker/landing/`).
Documentación de arquitectura y preparativos en `/home/tuxeng/Server/Doc/landing/`.

## Desarrollo local (PC con `.venv` + Node)
```bash
# 1. Levantar Postgres y Redis locales
docker compose -f docker-compose.dev.yml up -d

# 2. Backend FastAPI
cd backend
python3 -m venv .venv && source .venv/bin/activate   # PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend React + Vite (en otra terminal)
cd frontend
npm install
npm run dev
```

## Despliegue en `tuxserver` (Producción)
```bash
cd /mnt/raid/docker/landing
docker compose up -d --build
docker exec landing-api alembic upgrade head
```

## Pruebas rápidas
```bash
cd backend && pytest
```
