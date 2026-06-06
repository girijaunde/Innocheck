from __future__ import annotations

import logging
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.core.config import DATABASE_URL

logger = logging.getLogger(__name__)

db_url = DATABASE_URL
if not db_url:
    db_url = "sqlite:///./innocheck.db"
    logger.warning("No DATABASE_URL configured. Falling back to local SQLite.")

try:
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args=connect_args,
    )
    # Test the connection immediately to verify credentials/host
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to database.")
except Exception as e:
    logger.warning(f"Database connection to {db_url} failed: {e}. Falling back to local SQLite.")
    db_url = "sqlite:///./innocheck.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
try:
    Base = declarative_base()
except Exception:
    from sqlalchemy.ext.declarative import declarative_base as dec_base
    Base = dec_base()



@contextmanager
def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

