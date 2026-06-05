from __future__ import annotations

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt

from backend.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY, REFRESH_TOKEN_EXPIRE_DAYS


def hash_password(plain: str) -> str:
    # bcrypt has a 72-byte limit, truncate if necessary
    if len(plain.encode('utf-8')) > 72:
        plain = plain.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    # bcrypt has a 72-byte limit, truncate if necessary
    if len(plain.encode('utf-8')) > 72:
        plain = plain.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_access_token(subject: str, extra: Optional[dict[str, Any]] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire, "type": "access"}
    if extra:
        to_encode.update(extra)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def user_id_from_token(token: str) -> Optional[int]:
    try:
        payload = decode_token(token)
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError, TypeError):
        return None


def validate_token_type(token: str, expected_type: str) -> Optional[dict[str, Any]]:
    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != expected_type:
            return None
        return payload
    except (JWTError, ValueError, TypeError):
        return None
