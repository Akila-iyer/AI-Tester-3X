"""Storage Manager — file I/O abstraction for the platform."""

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any, Optional

from loggers.logger import get_logger

logger = get_logger(__name__)

_PROJECT_ROOT: Optional[str] = None


def _root() -> str:
    global _PROJECT_ROOT
    if _PROJECT_ROOT is None:
        _PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return _PROJECT_ROOT


def _resolve(rel_path: str) -> str:
    """Resolve a relative path against the project root."""
    return os.path.normpath(os.path.join(_root(), rel_path))


class StorageManager:
    """Static file I/O utilities."""

    @staticmethod
    def ensure_dirs() -> None:
        """Create all required directory structure."""
        dirs = [
            ".tmp/sessions",
            ".tmp/screenshots",
            ".tmp/figma",
            ".tmp/web",
            "output/reports",
            "output/history",
        ]
        for d in dirs:
            os.makedirs(_resolve(d), exist_ok=True)
        logger.info("Storage directories ensured")

    @staticmethod
    def save_json(rel_path: str, data: Any) -> str:
        """Save data as JSON to a path relative to project root.

        Args:
            rel_path: Relative path (e.g. '.tmp/sessions/abc/figma_elements.json').
            data: JSON-serializable data.

        Returns:
            Absolute path to the saved file.
        """
        abs_path = _resolve(rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
        logger.debug("Saved JSON: %s (%d bytes)", rel_path, os.path.getsize(abs_path))
        return abs_path

    @staticmethod
    def load_json(rel_path: str) -> Any:
        """Load JSON data from a path relative to project root.

        Args:
            rel_path: Relative path.

        Returns:
            Parsed JSON data, or None if file doesn't exist.
        """
        abs_path = _resolve(rel_path)
        if not os.path.exists(abs_path):
            logger.warning("File not found: %s", rel_path)
            return None
        with open(abs_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def save_binary(rel_path: str, data: bytes) -> str:
        """Save binary data (e.g. screenshot image).

        Args:
            rel_path: Relative path.
            data: Binary content.

        Returns:
            Absolute path to the saved file.
        """
        abs_path = _resolve(rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "wb") as f:
            f.write(data)
        logger.debug("Saved binary: %s (%d bytes)", rel_path, len(data))
        return abs_path

    @staticmethod
    def load_binary(rel_path: str) -> Optional[bytes]:
        """Load binary data from a path relative to project root.

        Args:
            rel_path: Relative path.

        Returns:
            Binary content, or None if file doesn't exist.
        """
        abs_path = _resolve(rel_path)
        if not os.path.exists(abs_path):
            return None
        with open(abs_path, "rb") as f:
            return f.read()

    @staticmethod
    def exists(rel_path: str) -> bool:
        """Check if a file exists relative to project root."""
        return os.path.exists(_resolve(rel_path))

    @staticmethod
    def list_dir(rel_path: str) -> list[str]:
        """List contents of a directory relative to project root.

        Args:
            rel_path: Relative directory path.

        Returns:
            Sorted list of filenames. Empty if directory doesn't exist.
        """
        abs_path = _resolve(rel_path)
        if not os.path.isdir(abs_path):
            return []
        return sorted(os.listdir(abs_path))

    @staticmethod
    def cleanup_temp(max_age_hours: int = 24) -> int:
        """Remove temp files older than max_age_hours.

        Args:
            max_age_hours: Age threshold in hours.

        Returns:
            Number of files/directories cleaned.
        """
        temp_dir = _resolve(".tmp")
        if not os.path.isdir(temp_dir):
            return 0

        cutoff = time.time() - (max_age_hours * 3600)
        count = 0

        for entry in Path(temp_dir).iterdir():
            if entry.is_dir():
                # Check directory modification time
                mtime = entry.stat().st_mtime
                if mtime < cutoff:
                    shutil.rmtree(str(entry), ignore_errors=True)
                    count += 1
                    logger.info("Cleaned old temp dir: %s", entry.name)

        logger.info("Cleanup complete: removed %d old temp items", count)
        return count
