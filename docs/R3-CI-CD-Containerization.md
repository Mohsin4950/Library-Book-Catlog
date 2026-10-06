# R3 - CI/CD & Containerization Engineer

Practical 10: End-to-End DevOps Pipeline | B3-G1 | Library Book Catalog
Role: R3 - CI/CD & Containerization Engineer | GitHub: rehansk-rcoe

## Aim
To automate building and testing of the Library Book Catalog API with GitHub Actions (Continuous Integration),
package it as a Docker image and publish the image to Docker Hub using GitHub Secrets
(following the procedure of ASDD Practical 3 - GitHub Actions CI).

## What R3 delivered
| Deliverable | File / location |
| --- | --- |
| CI workflow (YAML) | `.github/workflows/ci.yml` |
| Container image definition | `Dockerfile` |
| Files excluded from the image | `.dockerignore` |
| CI runs | GitHub -> Actions -> CI Pipeline |
| Docker Hub image | `mo53/library-book-catalog:latest` and `:<commit-sha>` |

## Pipeline
```
git push -> GitHub Actions "CI Pipeline"
  job 1 build-and-test : checkout -> setup Python 3.12 -> pip install -r requirements.txt -> pytest -v
  job 2 docker (needs job 1) : docker build -> run container + curl /health and /items
                               -> docker login (GitHub Secrets) -> docker push to Docker Hub (main only)
```
The docker job only runs when the tests pass, so a broken commit never produces an image.
The Docker Hub login and push steps run only on `main` and only when both secrets exist; without them the image
is still built and smoke-tested and the run stays green.

## GitHub Secrets used
| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Docker Hub -> Account settings -> Personal access tokens, Read & Write) |

Set in GitHub: repository -> Settings -> Secrets and variables -> Actions -> New repository secret.
The token is never written in the code; the workflow reads it as `${{ secrets.DOCKERHUB_TOKEN }}`.

## Practical 3 steps (adapted from Node.js to this Python project)
| Practical 3 step | In this project |
| --- | --- |
| Install Node.js, `node -v` | Python 3.12 (`python3 --version`); in CI `actions/setup-python` |
| Create index.js | `app.py` (from R2) |
| Create test.js | `test_app.py` (from R2, 4 pytest tests) |
| `npm init -y` / package.json | `requirements.txt` lists the dependencies |
| `npm test` locally | `python3 -m pytest -v` -> 4 passed |
| Create `.github/workflows` | `.github/workflows/` |
| Create `ci.yml` | `.github/workflows/ci.yml` (name: CI Pipeline, on: push) |
| `git add`, `git commit`, `git push` | commits `SCRUM-5 build: add Dockerfile ...` and `SCRUM-5 ci: add GitHub Actions pipeline ...` |
| Open Actions -> green tick | CI Pipeline run passed |
| Step 6 - make the workflow fail | `SCRUM-8 test: made test fail ...` changed the expected health status -> red X, docker job skipped |
| Step 7 - fix the error | `SCRUM-8 test: fixed test ...` -> green tick again |

## Local Docker check
```
$ docker build -t library-book-catalog:local .
$ docker run -d --name lbc-test -p 5001:5000 library-book-catalog:local
$ curl http://localhost:5001/health
{"status":"ok"}
```

## Hand-off to R4
- Image: `mo53/library-book-catalog:latest`, container port 5000.
- docker-compose service example:
  ```yaml
  app:
    image: mo53/library-book-catalog:latest
    ports: ["5000:5000"]
  ```
- The API does not expose `/metrics` yet; add a Prometheus exporter (e.g. `prometheus-flask-exporter`) before
  pointing Prometheus at it.

## Viva note (R3 question: CI vs CD, and why Secrets)
Continuous Integration automatically builds and tests every push, so errors are found within minutes
(demonstrated by the red run in step 6). Continuous Delivery/Deployment goes further and automatically packages
and releases the tested code; here the release is the Docker image pushed to Docker Hub. GitHub Secrets keep the
Docker Hub token encrypted and out of the repository, so it can be used by the pipeline without being visible
in the code or the logs.
