from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from backend.database.models import User
from backend.rate_limit import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    college: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)) -> dict[str, Any]:
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        college=body.college,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)) -> dict[str, Any]:
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }


class RefreshTokenBody(BaseModel):
    refresh_token: str


@router.post("/refresh")
@limiter.limit("20/minute")
def refresh_token(request: Request, body: RefreshTokenBody, db: Session = Depends(get_db)) -> dict[str, Any]:
    from backend.core.security import validate_token_type
    
    payload = validate_token_type(body.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    
    access_token = create_access_token(str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # seconds
    }


@router.get("/me")
def me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)) -> dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email, "college": user.college}
