import redis

from app.core.config import settings


def get_redis_client() -> redis.Redis | None:
    if not settings.redis_url:
        return None
    try:
        return redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2, socket_timeout=2)
    except Exception:
        return None


def redis_ping() -> bool:
    client = get_redis_client()
    if client is None:
        return False
    try:
        return bool(client.ping())
    except Exception:
        return False
