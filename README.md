# Library Book Catalog

Practical 10: End-to-End DevOps Pipeline | B3-G1

## Project status
- R1 (Jira planning): done.
- R2 (API, tests, feature branch, pull request, merge): done. See [docs/R2-Developer-Version-Control.md](docs/R2-Developer-Version-Control.md).
- R3 (GitHub Actions CI, Dockerfile, Docker Hub release): done - image published to Docker Hub as [mo53/library-book-catalog](https://hub.docker.com/r/mo53/library-book-catalog). See [docs/R3-CI-CD-Containerization.md](docs/R3-CI-CD-Containerization.md).
- R4 (Docker Compose deployment, Prometheus, Grafana): done - Prometheus target UP and Grafana dashboard. See [docs/R4-Deployment-Monitoring.md](docs/R4-Deployment-Monitoring.md).

![CI Pipeline](https://github.com/Mohsin4950/Library-Book-Catlog/actions/workflows/ci.yml/badge.svg)

## Scope
A small Flask REST API using an in-memory book list (no database), with a React web UI.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /items | List books |
| POST | /items | Add a book |
| GET | /health | Return a simple OK response |
| GET | /metrics | Prometheus metrics |
| GET | /api/errors | Error log: backend errors and errors reported by the frontend |
| GET | /api/errors/backend, /api/errors/frontend | The same log, one side only |
| POST | /api/errors | Used by the frontend to report its own errors |
| DELETE | /api/errors | Clear the error log |
| POST | /api/test-error | Fails on purpose (500) to demonstrate the error handling |
| GET | /ui/ | The React web UI (after `npm run build`) |

## Web UI (React + Vite)
The UI in `frontend/` lists and searches books (SCRUM-6), adds books with form validation (SCRUM-7) and shows the API health (SCRUM-8).

**Error handling, visible on both sides**
- Every backend error is returned as JSON with an id, e.g. `{"error": "...", "status": 400, "error_id": "ERR-0005"}`, printed in the Flask terminal (500 errors with the full traceback) and kept in the error log at `GET /api/errors`.
- The frontend catches failed API calls, network failures, crashed components (error boundaries), JavaScript errors and rejected promises. It shows them in a banner and in the **Error Center**, and reports each one to the backend, so it also appears in the Flask terminal as `[frontend:<kind>]`.
- The Error Center has two tabs: *Frontend errors* (this browser) and *Backend error log* (from `GET /api/errors`). Error ids link the two, e.g. FE-0001 -> backend ERR-0001.
- The "Test the error handling" panel triggers each kind of error on purpose.

**URLs to check the errors** (port 5000 by default)
| URL | Shows |
| --- | --- |
| http://localhost:5000/api/errors/backend | Backend errors (JSON, 500s include the traceback) |
| http://localhost:5000/api/errors/frontend | Errors reported by the frontend (JSON) |
| http://localhost:5000/api/errors | Both together, newest first |
| http://localhost:5000/ui/#frontend-errors | The UI, opened on the Error Center "Frontend errors" tab |
| http://localhost:5000/ui/#backend-errors | The UI, opened on the Error Center "Backend errors" tab |

The log is kept in memory, so it starts empty each time Flask restarts.

Development (two terminals, hot reload):
```bash
python app.py                      # terminal 1: Flask API on http://localhost:5000
cd frontend && npm install && npm run dev   # terminal 2: UI on http://localhost:5173
```
`npm run dev` forwards `/items`, `/health` and `/api` to Flask. If Flask runs on another port: `API_URL=http://localhost:5050 npm run dev`.

Single server (production build served by Flask):
```bash
cd frontend && npm install && npm run build && cd ..
python app.py                      # UI on http://localhost:5000/ui/
```

## Run locally
```bash
pip install -r requirements.txt
python app.py          # serves on http://localhost:5000
pytest -v              # runs the tests in test_app.py
```

Example requests:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/items
curl -X POST -H "Content-Type: application/json" \
     -d '{"title": "Refactoring", "author": "Martin Fowler"}' \
     http://localhost:5000/items
```

## Run with Docker
```bash
docker build -t library-book-catalog .
docker run -d -p 5000:5000 --name library-book-catalog library-book-catalog
curl http://localhost:5000/health
# UI: http://localhost:5000/ui/    backend log: docker logs -f library-book-catalog
```
The Dockerfile builds the React app in a Node stage and copies it into the Python image.

## Deploy with monitoring (Docker Compose)
```bash
docker compose up -d      # app + Prometheus + Grafana
docker compose ps
docker compose down       # stop everything
```

| Service | URL |
| --- | --- |
| API and web UI | http://localhost:5000 (UI at /ui/, metrics at /metrics) |
| Prometheus | http://localhost:9090 (Status -> Target health) |
| Grafana | http://localhost:3000/d/library-book-catalog (opens without login, read-only) |

## Jira plan
- [Epic SCRUM-5: End-to-End DevOps Pipeline](https://library-book-catalog.atlassian.net/browse/SCRUM-5)
- [SCRUM-6: View the library book catalog](https://library-book-catalog.atlassian.net/browse/SCRUM-6)
- [SCRUM-7: Add a book to the library catalog](https://library-book-catalog.atlassian.net/browse/SCRUM-7)
- [SCRUM-8: Check the library API health](https://library-book-catalog.atlassian.net/browse/SCRUM-8)
- Sprint: Library Catalog - Sprint 1
- Workflow: To Do -> In Progress -> In Review -> Done

Move a story to Done only after its acceptance criteria and evidence are verified.

## Responsibilities
| Role | Responsibility |
| --- | --- |
| R1 | Jira, commit traceability, screenshot collection, group report and own journal |
| R2 | API, simple test, feature branch, pull request and merge |
| R3 | GitHub Actions, Dockerfile, image build and Docker Hub release using GitHub Secrets |
| R4 | Docker Compose deployment, Prometheus target UP and Grafana panel |

## Commit traceability
Include the relevant Jira key in every new commit message. Examples:
- SCRUM-6 feat: list catalog books
- SCRUM-7 feat: add books to the catalog
- SCRUM-8 test: verify API health response
- SCRUM-5 docs: record DevOps pipeline evidence

R2 should implement on a feature branch, open a pull request and merge after review. Link actual commit and PR URLs from Jira. A Jira key in the message does not by itself prove an automatic GitHub/Jira integration is configured.

## Planned pipeline
Jira -> Git/GitHub -> GitHub Actions (build and test) -> Docker -> Docker Hub -> Docker Compose -> Prometheus + Grafana

## Evidence required for the group report
- Jira Epic, three stories and active sprint; final Done board after verification.
- GitHub commit history, feature branch and merged pull request.
- Green GitHub Actions run.
- Docker Hub image and tag.
- Running API response in the browser and POST/GET demonstration.
- Prometheus target UP and Grafana dashboard panel.

The group report must be 5-8 pages covering topic, architecture/pipeline, tools, steps, challenges and conclusion. Each member also submits a journal entry with Aim, brief theory, role/tasks, own screenshots and conclusion.
