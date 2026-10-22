"""Local append-oriented security audit event storage using SQLite.

CRITICAL ARCHITECTURAL BOUNDARY:
This audit store provides local, append-oriented operational and security event logging.
It is NOT by itself blockchain tamper-proof or cryptographically anchored.
It records security lifecycle events (verification, gated loads, blocked attempts,
and off-chain ML inferences) without persisting sensitive raw network payloads.
"""

from __future__ import annotations

import datetime
import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class AuditService:
    """Thread-safe SQLite service for logging and querying security audit events."""

    def __init__(self, db_path: str | Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        """Create the security_events table and necessary query indices."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS security_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    model_id TEXT,
                    model_version TEXT,
                    verification_status TEXT,
                    prediction TEXT,
                    inference_latency_ms REAL,
                    verification_latency_ms REAL,
                    status TEXT NOT NULL,
                    details_json TEXT
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_events_event_id ON security_events (event_id);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_events_timestamp ON security_events (timestamp);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_events_type ON security_events (event_type);"
            )

    def log_event(
        self,
        event_type: str,
        status: str,
        model_id: Optional[str] = None,
        model_version: Optional[str] = None,
        verification_status: Optional[str] = None,
        prediction: Optional[str] = None,
        inference_latency_ms: Optional[float] = None,
        verification_latency_ms: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record a structured security event in the local audit store."""
        event_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        clean_details = details or {}
        details_json = json.dumps(clean_details)

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO security_events (
                    event_id, timestamp, event_type, model_id, model_version,
                    verification_status, prediction, inference_latency_ms,
                    verification_latency_ms, status, details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    event_id,
                    timestamp,
                    event_type,
                    model_id,
                    model_version,
                    verification_status,
                    prediction,
                    inference_latency_ms,
                    verification_latency_ms,
                    status,
                    details_json,
                ),
            )

        return {
            "event_id": event_id,
            "timestamp": timestamp,
            "event_type": event_type,
            "model_id": model_id,
            "model_version": model_version,
            "verification_status": verification_status,
            "prediction": prediction,
            "inference_latency_ms": inference_latency_ms,
            "verification_latency_ms": verification_latency_ms,
            "status": status,
            "details": clean_details,
        }

    def get_event(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single audit event by unique UUID."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT event_id, timestamp, event_type, model_id, model_version,
                       verification_status, prediction, inference_latency_ms,
                       verification_latency_ms, status, details_json
                FROM security_events
                WHERE event_id = ?;
                """,
                (event_id,),
            )
            row = cursor.fetchone()

        if row is None:
            return None

        return self._row_to_dict(row)

    def get_events(
        self,
        limit: int = 50,
        offset: int = 0,
        event_type: Optional[str] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Retrieve paginated security events, ordered newest first."""
        limit = max(1, min(limit, 500))
        offset = max(0, offset)

        with self._get_connection() as conn:
            if event_type:
                count_cursor = conn.execute(
                    "SELECT COUNT(*) FROM security_events WHERE event_type = ?;",
                    (event_type,),
                )
                total = count_cursor.fetchone()[0]

                rows_cursor = conn.execute(
                    """
                    SELECT event_id, timestamp, event_type, model_id, model_version,
                           verification_status, prediction, inference_latency_ms,
                           verification_latency_ms, status, details_json
                    FROM security_events
                    WHERE event_type = ?
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?;
                    """,
                    (event_type, limit, offset),
                )
            else:
                count_cursor = conn.execute("SELECT COUNT(*) FROM security_events;")
                total = count_cursor.fetchone()[0]

                rows_cursor = conn.execute(
                    """
                    SELECT event_id, timestamp, event_type, model_id, model_version,
                           verification_status, prediction, inference_latency_ms,
                           verification_latency_ms, status, details_json
                    FROM security_events
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?;
                    """,
                    (limit, offset),
                )

            rows = rows_cursor.fetchall()

        events = [self._row_to_dict(r) for r in rows]
        return events, total

    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
        details = {}
        if row["details_json"]:
            try:
                details = json.loads(row["details_json"])
            except Exception:
                details = {"raw": row["details_json"]}

        return {
            "event_id": row["event_id"],
            "timestamp": row["timestamp"],
            "event_type": row["event_type"],
            "model_id": row["model_id"],
            "model_version": row["model_version"],
            "verification_status": row["verification_status"],
            "prediction": row["prediction"],
            "inference_latency_ms": row["inference_latency_ms"],
            "verification_latency_ms": row["verification_latency_ms"],
            "status": row["status"],
            "details": details,
        }
