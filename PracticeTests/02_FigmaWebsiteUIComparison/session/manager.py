"""Session Manager — lifecycle, state machine, and persistence."""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from loggers.logger import get_logger
from storage.manager import StorageManager

logger = get_logger(__name__)

VALID_TRANSITIONS = {
    "pending": {"extracting", "failed"},
    "extracting": {"matching", "failed"},
    "matching": {"comparing", "failed"},
    "comparing": {"analyzing", "reporting", "failed"},
    "analyzing": {"reporting", "failed"},
    "reporting": {"complete", "failed"},
    "complete": set(),
    "failed": set(),
}


class SessionManager:
    """Manages session lifecycle, status transitions, and persistence."""

    SESSION_DIR = ".tmp/sessions"
    HISTORY_DIR = "output/history"
    HISTORY_INDEX = "output/history/index.json"

    @staticmethod
    def create(config: dict) -> dict:
        """Create a new session with a unique ID.

        Args:
            config: Configuration snapshot for this comparison run.

        Returns:
            Session dict with id, status, timestamps, config.
        """
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        session = {
            "id": session_id,
            "status": "pending",
            "created_at": now,
            "completed_at": None,
            "config": config,
            "summary": None,
            "error": None,
        }

        # Ensure session directory exists
        session_dir = f"{SessionManager.SESSION_DIR}/{session_id}"
        os.makedirs(
            os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                session_dir,
            ),
            exist_ok=True,
        )

        SessionManager._save(session)
        logger.info("Session created: %s (pending)", session_id)
        return session

    @staticmethod
    def get(session_id: str) -> Optional[dict]:
        """Load a session by ID.

        Args:
            session_id: UUID string.

        Returns:
            Session dict, or None if not found.
        """
        path = f"{SessionManager.SESSION_DIR}/{session_id}/session.json"
        return StorageManager.load_json(path)

    @staticmethod
    def update_status(session_id: str, new_status: str, error: Optional[str] = None) -> Optional[dict]:
        """Transition the session to a new status.

        Args:
            session_id: UUID string.
            new_status: Target status.
            error: Optional error message (for failed status).

        Returns:
            Updated session dict, or None if session not found.

        Raises:
            ValueError: If the transition is invalid.
        """
        session = SessionManager.get(session_id)
        if session is None:
            logger.error("Session not found: %s", session_id)
            return None

        old_status = session["status"]

        if new_status not in VALID_TRANSITIONS.get(old_status, set()):
            raise ValueError(
                f"Invalid status transition: {old_status} -> {new_status}. "
                f"Allowed: {VALID_TRANSITIONS.get(old_status, set())}"
            )

        session["status"] = new_status
        if new_status == "complete":
            session["completed_at"] = datetime.now(timezone.utc).isoformat()
        if error:
            session["error"] = error

        SessionManager._save(session)
        logger.info("Session %s: %s -> %s", session_id, old_status, new_status)
        return session

    @staticmethod
    def save_intermediate(session_id: str, stage: str, data: Any) -> None:
        """Save intermediate results for a session stage.

        Args:
            session_id: UUID string.
            stage: Stage name (figma_elements, web_elements, matched_pairs, etc.).
            data: JSON-serializable data.
        """
        path = f"{SessionManager.SESSION_DIR}/{session_id}/{stage}.json"
        StorageManager.save_json(path, data)

    @staticmethod
    def load_intermediate(session_id: str, stage: str) -> Any:
        """Load intermediate results for a session stage.

        Args:
            session_id: UUID string.
            stage: Stage name.

        Returns:
            Parsed JSON data, or None if not found.
        """
        path = f"{SessionManager.SESSION_DIR}/{session_id}/{stage}.json"
        return StorageManager.load_json(path)

    @staticmethod
    def list_sessions(limit: int = 25, offset: int = 0) -> list[dict]:
        """List recent sessions from the history index.

        Args:
            limit: Max results.
            offset: Pagination offset.

        Returns:
            List of session summary dicts.
        """
        index = StorageManager.load_json(SessionManager.HISTORY_INDEX) or []
        index.sort(key=lambda x: x.get("date", ""), reverse=True)
        return index[offset : offset + limit]

    @staticmethod
    def save_to_history(session_id: str) -> None:
        """Append a completed session to the history index.

        Args:
            session_id: UUID string.
        """
        session = SessionManager.get(session_id)
        if session is None:
            return

        summary = session.get("summary") or {}
        entry = {
            "id": session_id,
            "date": session.get("created_at", ""),
            "figma_url": session.get("config", {}).get("figma_url", ""),
            "web_url": session.get("config", {}).get("web_url", ""),
            "pass_rate": summary.get("overall_similarity", 0),
            "status": session.get("status", ""),
        }

        # Save full summary to history dir
        history_file = f"{SessionManager.HISTORY_DIR}/{session_id}/summary.json"
        StorageManager.save_json(history_file, summary)

        # Update index
        index = StorageManager.load_json(SessionManager.HISTORY_INDEX) or []
        # Remove existing entry for same session (shouldn't happen, but be safe)
        index = [e for e in index if e.get("id") != session_id]
        index.append(entry)

        # Enforce max_runs limit
        config = session.get("config", {})
        max_runs = config.get("history", {}).get("max_runs", 100)
        index = sorted(index, key=lambda x: x.get("date", ""), reverse=True)[:max_runs]

        StorageManager.save_json(SessionManager.HISTORY_INDEX, index)
        logger.info("Session saved to history: %s", session_id)

    @staticmethod
    def _save(session: dict) -> None:
        """Persist session metadata to disk."""
        path = f"{SessionManager.SESSION_DIR}/{session['id']}/session.json"
        StorageManager.save_json(path, session)
