import pytest

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
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
