from fastapi import Request
from slowapi import Limiter


def get_real_client_ip(request: Request) -> str:
    """Extrae la IP real del visitante detrás de Cloudflare Tunnel o Caddy."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


limiter = Limiter(key_func=get_real_client_ip)
