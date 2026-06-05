"""Structured logging configuration for InnoCheck backend."""

import logging
import logging.handlers
import sys
from pathlib import Path

from backend.core.config import DEBUG_MODE


def setup_logger(name: str) -> logging.Logger:
    """Configure and return a logger with both file and console handlers."""
    logger = logging.getLogger(name)
    
    if logger.handlers:  # Already configured
        return logger
    
    logger.setLevel(logging.DEBUG if DEBUG_MODE else logging.INFO)
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    simple_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    
    # Ensure console output can safely encode unicode in Windows terminals
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO if DEBUG_MODE else logging.WARNING)
    console_handler.setFormatter(simple_formatter)
    logger.addHandler(console_handler)
    
    # File handler (only in production)
    if not DEBUG_MODE:
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / "innocheck.log",
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(detailed_formatter)
        logger.addHandler(file_handler)
    
    return logger
