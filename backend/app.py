"""InnoCheck FastAPI application entry."""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from traceback import format_exc
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.core.config import CORS_ORIGINS
from backend.core.logging_config import setup_logger
from backend.database.connection import Base, engine
from backend.rate_limit import limiter
from backend.routers import analysis, auth, codegen, codestudio, dashboard, feedback, literature, plagiarism, prototype, sessions, validate

# Setup logging
logger = setup_logger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="InnoCheck API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    description="AI-powered hackathon idea validation and analysis platform"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if request.url.path == "/api/plagiarism/check":
        for error in errors:
            loc = list(error.get("loc", []))
            if loc == ["body", "text"] and error.get("type") in {"string_too_long", "value_error"}:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "success": False,
                        "detail": "Input text is too large. Maximum allowed length is 50000 characters.",
                    },
                )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "success": False,
            "message": "Validation failed.",
            "detail": errors,
        }),
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder({
            "success": False,
            "message": str(exc.detail) if exc.detail else "Request error.",
            "detail": exc.detail,
            "exception_type": exc.__class__.__name__,
        }),
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during request: {request.method} {request.url}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=jsonable_encoder({
            "success": False,
            "message": "Internal server error. Please check the request and try again.",
            "detail": str(exc),
            "exception_type": exc.__class__.__name__,
            "traceback": format_exc(),
        }),
    )

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app|https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logger.info(f"CORS enabled for: {', '.join(CORS_ORIGINS)}")

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(sessions.router)
app.include_router(validate.router)
app.include_router(prototype.router)
app.include_router(analysis.router)
app.include_router(feedback.router)
app.include_router(plagiarism.router)
app.include_router(codegen.router)
app.include_router(codestudio.router)
app.include_router(literature.router)

logger.info("All routers registered")


@app.get("/api/health")
def health() -> dict:
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "InnoCheck API v2.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("=" * 60)
    logger.info("InnoCheck Backend starting...")
    logger.info("=" * 60)
    logger.info("Database connected")
    logger.info("Rate limiting enabled")
    logger.info("API documentation available at /docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("=" * 60)
    logger.info("InnoCheck Backend shutting down...")
    logger.info("=" * 60)
