"""Library Book Catalog - a small Flask REST API with an in-memory book list."""

import logging
import os
import traceback
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from prometheus_flask_exporter import PrometheusMetrics
from werkzeug.exceptions import HTTPException

from error_log import ErrorLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
log = logging.getLogger("library")


class HidePollingRequests(logging.Filter):
    """Keep the terminal readable: the UI polls these every few seconds."""

    def filter(self, record):
        message = record.getMessage()
        return not any(f'"GET {path} HTTP/1.1" 200' in message for path in ("/health", "/api/errors"))


logging.getLogger("werkzeug").addFilter(HidePollingRequests())

app = Flask(__name__)

# Exposes GET /metrics for Prometheus (request counts and latencies per endpoint)
metrics = PrometheusMetrics(app)
metrics.info("library_app_info", "Library Book Catalog API", version="1.1.0")

# Errors from the backend and from the React frontend, readable at GET /api/errors
error_log = ErrorLog()

# Built React app (npm run build in frontend/), served at /ui/
UI_DIR = Path(__file__).resolve().parent / "frontend" / "dist"

MAX_FIELD_LENGTH = 200

# In-memory catalog (no database). Resets every time the app restarts.
books = [
    {"id": 1, "title": "Clean Code", "author": "Robert C. Martin"},
    {"id": 2, "title": "The Pragmatic Programmer", "author": "Andrew Hunt, David Thomas"},
    {"id": 3, "title": "Continuous Delivery", "author": "Jez Humble, David Farley"},
]


def error_response(status, message, details=None):
    """Record a backend error, log it to the terminal and return it as JSON."""
    entry = error_log.add(
        source="backend",
        kind="server" if status >= 500 else "client-request",
        status=status,
        method=request.method,
        path=request.path,
        message=message,
        details=details,
    )
    level = logging.ERROR if status >= 500 else logging.WARNING
    log.log(level, "%s %s %s -> %s %s", entry["id"], request.method, request.path, status, message)
    if details and status >= 500:
        log.error("%s traceback:\n%s", entry["id"], details)
    return jsonify({"error": message, "status": status, "error_id": entry["id"]}), status


@app.errorhandler(HTTPException)
def handle_http_error(exc):
    return error_response(exc.code, exc.description or exc.name)


@app.errorhandler(Exception)
def handle_unexpected_error(exc):
    return error_response(500, f"Internal server error: {exc}", details=traceback.format_exc())


@app.route("/")
def index():
    return jsonify(
        {
            "service": "Library Book Catalog",
            "endpoints": ["GET /items", "POST /items", "GET /health", "GET /metrics",
                          "GET /api/errors", "GET /api/errors/backend", "GET /api/errors/frontend",
                          "POST /api/errors", "DELETE /api/errors"],
            "ui": "/ui/",
        }
    )


# SCRUM-6: View the library book catalog
@app.route("/items", methods=["GET"])
def list_items():
    return jsonify(books), 200


# SCRUM-7: Add a book to the library catalog
@app.route("/items", methods=["POST"])
def add_item():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response(400, "Request body must be a JSON object with 'title' and 'author'")

    title = str(data.get("title") or "").strip()
    author = str(data.get("author") or "").strip()

    if not title or not author:
        return error_response(400, "Both 'title' and 'author' are required")
    if len(title) > MAX_FIELD_LENGTH or len(author) > MAX_FIELD_LENGTH:
        return error_response(400, f"'title' and 'author' must be at most {MAX_FIELD_LENGTH} characters")

    book = {
        "id": max((b["id"] for b in books), default=0) + 1,
        "title": title,
        "author": author,
    }
    books.append(book)
    log.info("Book added: #%s %r by %r", book["id"], title, author)
    return jsonify(book), 201


# SCRUM-8: Check the library API health
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# Error log: backend errors plus errors reported by the frontend
@app.route("/api/errors", methods=["GET"])
def list_errors():
    source = request.args.get("source")
    if source not in (None, "backend", "frontend"):
        return error_response(400, "'source' must be 'backend' or 'frontend'")
    errors = error_log.list(source)
    return jsonify({"count": len(errors), "errors": errors}), 200


# Short URLs to check each side in the browser
@app.route("/api/errors/backend", methods=["GET"])
def list_backend_errors():
    errors = error_log.list("backend")
    return jsonify({"source": "backend", "count": len(errors), "errors": errors}), 200


@app.route("/api/errors/frontend", methods=["GET"])
def list_frontend_errors():
    errors = error_log.list("frontend")
    return jsonify({"source": "frontend", "count": len(errors), "errors": errors}), 200


@app.route("/api/errors", methods=["POST"])
def report_frontend_error():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not str(data.get("message") or "").strip():
        return error_response(400, "Error report must be a JSON object with a 'message'")

    entry = error_log.add(
        source="frontend",
        kind=str(data.get("kind") or "unknown")[:50],
        status=data.get("status") if isinstance(data.get("status"), int) else None,
        method=str(data.get("method"))[:10] if data.get("method") else None,
        path=str(data.get("path"))[:500] if data.get("path") else None,
        message=str(data["message"]).strip()[:500],
        details=str(data.get("details"))[:4000] if data.get("details") else None,
        related_error_id=str(data.get("related_error_id"))[:20] if data.get("related_error_id") else None,
    )
    log.error("%s [frontend:%s] %s", entry["id"], entry["kind"], entry["message"])
    return jsonify(entry), 201


@app.route("/api/errors", methods=["DELETE"])
def clear_errors():
    cleared = error_log.clear()
    log.info("Error log cleared (%s entries)", cleared)
    return jsonify({"cleared": cleared}), 200


# Deliberately fails so the error handling can be demonstrated from the UI
@app.route("/api/test-error", methods=["POST"])
def trigger_test_error():
    raise RuntimeError("Test error triggered from the UI")


# React frontend
@app.route("/ui")
@app.route("/ui/")
@app.route("/ui/<path:filename>")
def frontend(filename="index.html"):
    if not (UI_DIR / "index.html").is_file():
        return error_response(404, "Frontend is not built. Run 'npm run build' in the frontend folder.")
    return send_from_directory(UI_DIR, filename)


# Browsers request this automatically; answer it instead of logging a 404 every time
@app.route("/favicon.ico")
def favicon():
    if (UI_DIR / "favicon.svg").is_file():
        return send_from_directory(UI_DIR, "favicon.svg", mimetype="image/svg+xml")
    return "", 204


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
