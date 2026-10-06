"""In-memory error log shared by the backend and the React frontend.

Backend errors are recorded by the Flask error handlers; frontend errors are
reported by the browser through POST /api/errors. Both can be read back with
GET /api/errors, so the UI can show them side by side.
"""

import itertools
import threading
from collections import deque
from datetime import datetime, timezone


class ErrorLog:
    def __init__(self, max_entries=200):
        self._entries = deque(maxlen=max_entries)
        self._ids = itertools.count(1)
        self._lock = threading.Lock()

    def add(self, source, message, status=None, method=None, path=None, details=None,
            kind=None, related_error_id=None):
        with self._lock:
            entry = {
                "id": f"ERR-{next(self._ids):04d}",
                "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "source": source,
                "kind": kind,
                "status": status,
                "method": method,
                "path": path,
                "message": message,
                "details": details,
                "related_error_id": related_error_id,
            }
            self._entries.appendleft(entry)
            return entry

    def list(self, source=None):
        with self._lock:
            return [e for e in self._entries if source is None or e["source"] == source]

    def clear(self):
        with self._lock:
            count = len(self._entries)
            self._entries.clear()
            return count
