import pytest

from app import app, error_log


@pytest.fixture
def client():
    app.config["TESTING"] = True
    error_log.clear()
    with app.test_client() as client:
        yield client


# SCRUM-8: the health check must return 200 and status "ok"
def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


# SCRUM-6: the catalog must return a list of books
def test_get_items(client):
    response = client.get("/items")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


# SCRUM-7: a new book must be added and then appear in the catalog
def test_post_item(client):
    response = client.post("/items", json={"title": "Accelerate", "author": "Nicole Forsgren"})
    assert response.status_code == 201
    new_book = response.get_json()
    assert new_book["title"] == "Accelerate"

    titles = [book["title"] for book in client.get("/items").get_json()]
    assert "Accelerate" in titles


def test_post_item_requires_title_and_author(client):
    response = client.post("/items", json={"title": "No author"})
    assert response.status_code == 400


# Monitoring (R4): Prometheus must be able to scrape request metrics
def test_metrics(client):
    client.get("/items")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert b"flask_http_request_total" in response.data


# Error handling: every backend error is JSON, has an id and is stored in the error log
def test_invalid_book_is_logged_as_backend_error(client):
    response = client.post("/items", json={"title": "No author"})
    error_id = response.get_json()["error_id"]

    errors = client.get("/api/errors?source=backend").get_json()["errors"]
    assert errors[0]["id"] == error_id
    assert errors[0]["status"] == 400
    assert errors[0]["path"] == "/items"


def test_post_item_rejects_non_object_json(client):
    response = client.post("/items", json=["not", "an", "object"])
    assert response.status_code == 400
    assert "error_id" in response.get_json()


def test_unknown_route_returns_json_404(client):
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    body = response.get_json()
    assert body["status"] == 404
    assert body["error_id"].startswith("ERR-")


def test_wrong_method_returns_json_405(client):
    response = client.delete("/items")
    assert response.status_code == 405
    assert response.get_json()["status"] == 405


def test_server_error_returns_500_with_traceback_in_log(client):
    response = client.post("/api/test-error")
    assert response.status_code == 500
    error_id = response.get_json()["error_id"]

    entry = client.get("/api/errors").get_json()["errors"][0]
    assert entry["id"] == error_id
    assert "RuntimeError" in entry["details"]


def test_frontend_error_report_is_stored(client):
    response = client.post("/api/errors", json={
        "kind": "runtime", "message": "Cannot read properties of undefined", "related_error_id": "ERR-0001",
    })
    assert response.status_code == 201

    errors = client.get("/api/errors?source=frontend").get_json()["errors"]
    assert errors[0]["message"] == "Cannot read properties of undefined"
    assert errors[0]["related_error_id"] == "ERR-0001"


def test_frontend_error_report_requires_message(client):
    response = client.post("/api/errors", json={"kind": "runtime"})
    assert response.status_code == 400


def test_errors_source_filter_is_validated(client):
    assert client.get("/api/errors?source=other").status_code == 400


def test_clear_errors(client):
    client.get("/does-not-exist")
    assert client.delete("/api/errors").get_json()["cleared"] >= 1
    assert client.get("/api/errors").get_json()["count"] == 0


def test_error_urls_per_source(client):
    client.post("/items", json={})
    client.post("/api/errors", json={"kind": "runtime", "message": "Frontend failure"})

    backend = client.get("/api/errors/backend").get_json()
    frontend = client.get("/api/errors/frontend").get_json()
    assert backend["count"] == 1 and backend["errors"][0]["source"] == "backend"
    assert frontend["count"] == 1 and frontend["errors"][0]["message"] == "Frontend failure"
