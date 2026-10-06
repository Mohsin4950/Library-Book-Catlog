"""Library Book Catalog - a small Flask REST API with an in-memory book list."""

from flask import Flask, jsonify

app = Flask(__name__)

# In-memory catalog (no database). Resets every time the app restarts.
books = [
    {"id": 1, "title": "Clean Code", "author": "Robert C. Martin"},
    {"id": 2, "title": "The Pragmatic Programmer", "author": "Andrew Hunt, David Thomas"},
    {"id": 3, "title": "Continuous Delivery", "author": "Jez Humble, David Farley"},
]


@app.route("/")
def index():
    return jsonify(
        {
            "service": "Library Book Catalog",
            "endpoints": ["GET /items"],
        }
    )


# SCRUM-6: View the library book catalog
@app.route("/items", methods=["GET"])
def list_items():
    return jsonify(books), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
