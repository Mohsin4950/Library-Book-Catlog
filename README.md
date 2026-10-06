# Library Book Catalog

Practical 10: End-to-End DevOps Pipeline | B3-G1

## Project status
- R1 (Jira planning): done.
- R2 (API, tests, feature branch, pull request, merge): done. See [docs/R2-Developer-Version-Control.md](docs/R2-Developer-Version-Control.md).
- R3 (GitHub Actions CI, Dockerfile, Docker Hub release): CI and Docker done; Docker Hub push runs once the `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secrets are set. See [docs/R3-CI-CD-Containerization.md](docs/R3-CI-CD-Containerization.md).
- R4 (Compose, Prometheus, Grafana): pending.

![CI Pipeline](https://github.com/Mohsin4950/Library-Book-Catlog/actions/workflows/ci.yml/badge.svg)

## Scope
A small Flask REST API using an in-memory book list (no database).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /items | List books |
| POST | /items | Add a book |
| GET | /health | Return a simple OK response |

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
```

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
