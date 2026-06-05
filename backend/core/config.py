from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

_root = Path(__file__).resolve().parents[2]
load_dotenv(_root / ".env")
load_dotenv(_root / "backend" / ".env")

logger = logging.getLogger(__name__)


def _get(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


# Environment Configuration
DEBUG_MODE = _get("DEBUG", "false").lower() in ("true", "1", "yes")
ENVIRONMENT = _get("ENVIRONMENT", "development")

# Security
SECRET_KEY = _get("SECRET_KEY", "change-me-in-production-use-openssl-rand-hex-32")
if SECRET_KEY == "change-me-in-production-use-openssl-rand-hex-32":
    if ENVIRONMENT == "production":
        raise ValueError("SECRET_KEY must be set in production environment")
    logger.warning("⚠️  Using default SECRET_KEY. Set SECRET_KEY in .env for production.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(_get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days
REFRESH_TOKEN_EXPIRE_DAYS = int(_get("REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days

# AI Services
GEMINI_API_KEY = _get("GEMINI_API_KEY")
GEMINI_MODEL = _get("GEMINI_MODEL", "gemini-1.5-flash")
GROQ_API_KEY = _get("GROQ_API_KEY")
GROQ_MODEL = _get("GROQ_MODEL", "llama-3.1-8b-instant")
OPENAI_API_KEY = _get("OPENAI_API_KEY")
OPENAI_MODEL = _get("OPENAI_MODEL", "gpt-4o-mini")

# Fallback to Gemini or Groq if OpenAI is not configured
AVAILABLE_AI_PROVIDERS = []
if OPENAI_API_KEY:
    AVAILABLE_AI_PROVIDERS.append({
        "name": "openai",
        "api_key": OPENAI_API_KEY,
        "model": OPENAI_MODEL,
        "base_url": None
    })
if GROQ_API_KEY:
    AVAILABLE_AI_PROVIDERS.append({
        "name": "groq",
        "api_key": GROQ_API_KEY,
        "model": GROQ_MODEL,
        "base_url": "https://api.groq.com/openai/v1"
    })
if GEMINI_API_KEY:
    AVAILABLE_AI_PROVIDERS.append({
        "name": "gemini",
        "api_key": GEMINI_API_KEY,
        "model": GEMINI_MODEL,
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/"
    })

AI_PROVIDER = AVAILABLE_AI_PROVIDERS[0]["name"] if AVAILABLE_AI_PROVIDERS else "none"

if not AVAILABLE_AI_PROVIDERS:
    logger.warning("⚠️  No AI provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in .env")
else:
    provider_names = [p["name"].upper() for p in AVAILABLE_AI_PROVIDERS]
    logger.info(f"✓ AI Providers available: {', '.join(provider_names)} (Primary: {AI_PROVIDER.upper()})")

# Database
DATABASE_URL = _get("DATABASE_URL", "sqlite:///./innocheck.db")

# CORS
CORS_ORIGINS = _get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:8080",
).split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]

# Startup Validation
logger.info(f"Environment: {ENVIRONMENT} | Debug: {DEBUG_MODE} | AI: {AI_PROVIDER.upper()}")
