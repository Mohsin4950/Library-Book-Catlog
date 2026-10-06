"""Library Book Catalog - a small Flask REST API with an in-memory book list."""

from flask import Flask, jsonify, request

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
            "endpoints": ["GET /items", "POST /items"],
        }
    )


# SCRUM-6: View the library book catalog
@app.route("/items", methods=["GET"])
def list_items():
    return jsonify(books), 200


# SCRUM-7: Add a book to the library catalog
@app.route("/items", methods=["POST"])
def add_item():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    author = str(data.get("author", "")).strip()

    if not title or not author:
        return jsonify({"error": "Both 'title' and 'author' are required"}), 400

    book = {
        "id": max((b["id"] for b in books), default=0) + 1,
        "title": title,
        "author": author,
    }
    books.append(book)
    return jsonify(book), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
