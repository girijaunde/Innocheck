from __future__ import annotations

from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.core.security import user_id_from_token
from backend.database.connection import SessionLocal
from backend.database.models import User

security = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> int:
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    uid = user_id_from_token(creds.credentials)
    if uid is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == uid, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return uid


def get_optional_user_id(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[int]:
    if not creds or not creds.credentials:
        return None
    return user_id_from_token(creds.credentials)
