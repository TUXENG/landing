from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    environment: str = "development"
    app_name: str = "TuxEng Landing"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    database_url: str = "postgresql+psycopg://landing_user:dev_password@127.0.0.1:5432/landing_db"
    redis_url: str = "redis://:dev_redis_password@127.0.0.1:6379/0"

    secret_key: str = "dev-insecure-secret-change-in-production"
    access_token_expire_minutes: int = 480
    admin_email: str = "admin@tudominio.com"
    admin_initial_password: str = ""

    upload_dir: str = "/app/uploads"
    max_upload_mb: int = 5

    telegram_leads_enabled: bool = False
    telegram_leads_bot_token: str = ""
    telegram_leads_chat_id: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
