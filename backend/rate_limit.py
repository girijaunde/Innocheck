"""Rate limiting (slowapi) with optional per-user keys."""

from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.security import user_id_from_token


def rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1].strip()
        uid = user_id_from_token(token)
        if uid is not None:
            return f"user:{uid}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=rate_limit_key)
