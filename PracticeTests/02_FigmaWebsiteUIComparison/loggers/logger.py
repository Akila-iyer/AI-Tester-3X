"""Centralized logging for Visual UI Testing Platform."""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler


_LOG_DIR = None  # Resolved lazily


def _ensure_log_dir():
    global _LOG_DIR
    if _LOG_DIR is None:
        _LOG_DIR = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp"
        )
        os.makedirs(_LOG_DIR, exist_ok=True)
    return _LOG_DIR


def setup_logging(level: str = "INFO") -> None:
    """Configure root logger with console and file handlers.

    Args:
        level: Log level string (DEBUG, INFO, WARNING, ERROR).
    """
    log_level = getattr(logging, level.upper(), logging.INFO)
    log_dir = _ensure_log_dir()
    log_path = os.path.join(log_dir, "vut.log")

    root = logging.getLogger()
    root.setLevel(log_level)

    # Remove existing handlers to avoid duplicates on re-init
    root.handlers.clear()

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)-7s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler — only INFO+
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(formatter)
    root.addHandler(console)

    # File handler — DEBUG+ with rotation
    file_handler = RotatingFileHandler(log_path, maxBytes=5 * 1024 * 1024, backupCount=3)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a module-level logger.

    Args:
        name: Usually __name__ from the calling module.

    Returns:
        Configured logger instance.
    """
    return logging.getLogger(name)
