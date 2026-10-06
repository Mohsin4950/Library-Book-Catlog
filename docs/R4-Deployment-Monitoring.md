# R4 - Deployment & Monitoring Engineer

Practical 10: End-to-End DevOps Pipeline | B3-G1 | Library Book Catalog
Role: R4 - Deployment & Monitoring Engineer | GitHub: M-misbah

## Aim
To deploy the Library Book Catalog API with Docker Compose together with Prometheus and Grafana,
confirm that Prometheus scrapes the API (target UP) and show the API's metrics on a Grafana dashboard
(following the Docker procedure of ASDD Practical 5).

## What R4 delivered
| Deliverable | File / location |
| --- | --- |
| Metrics endpoint in the API (`GET /metrics`) | `app.py`, `requirements.txt` (prometheus-flask-exporter), test in `test_app.py` |
| Compose stack: app + Prometheus + Grafana | `docker-compose.yml` |
| Prometheus scrape configuration | `prometheus/prometheus.yml` |
| Grafana data source (Prometheus) | `grafana/provisioning/datasources/prometheus.yml` |
| Grafana dashboard loader | `grafana/provisioning/dashboards/dashboards.yml` |
| Grafana dashboard "Library Book Catalog API" | `grafana/dashboards/library-book-catalog.json` |

## Architecture
```
          docker compose up -d
 ┌────────────────────────────────────────────────────────────┐
 │  app  (mo53/library-book-catalog:latest from Docker Hub)   │  :5000  /items /health /metrics
 │     ▲ scrape every 5s                                      │
 │  prometheus (prom/prometheus:v3.5.0)                       │  :9090  target library-app = UP
 │     ▲ PromQL queries                                       │
 │  grafana (grafana/grafana:12.1.1)                          │  :3000  dashboard with 4 panels
 └────────────────────────────────────────────────────────────┘
```
The app image is the one built and pushed by the R3 GitHub Actions pipeline, so the deployment uses the same
tested artefact that CI produced.

## Grafana dashboard panels
| Panel | PromQL |
| --- | --- |
| API target status (UP/DOWN) | `up{job="library-app"}` |
| Total HTTP requests | `sum(flask_http_request_total)` |
| Average response time | `sum(rate(flask_http_request_duration_seconds_sum[1m])) / sum(rate(flask_http_request_duration_seconds_count[1m]))` |
| Requests per second by endpoint | `sum by (method, path) (rate(flask_http_request_duration_seconds_count[1m]))` |

The data source and dashboard are provisioned from files, so they appear automatically on `docker compose up`.
Anonymous read-only (Viewer) access is enabled so the dashboard opens without logging in.

## Practical 5 steps carried out on this project
| Practical 5 step | Command / result |
| --- | --- |
| 1 - Verify Docker | `docker --version` -> Docker version 29.5.3 |
| 3-5 - App, requirements.txt, Dockerfile | `app.py`, `requirements.txt`, `Dockerfile` already in the repo (R2/R3) |
| 7 - Build image | `docker build -t library-book-catalog .` then `docker images library-book-catalog` |
| 8 - Run container | `docker run -p 5000:5000 library-book-catalog` -> "Running on http://0.0.0.0:5000" |
| 9 - Open browser | `http://localhost:5000` shows the service and its endpoints |
| 10 - Running containers | `docker ps` |
| 11 - Stop container | `docker stop <container-id>` |
| 12 - All containers | `docker ps -a` -> container shown as Exited |
| 13 - Remove container | `docker rm <container-id>` |
| 14 - Remove image | `docker rmi library-book-catalog` |
| R4 deployment | `docker compose up -d`, `docker compose ps` -> app, prometheus, grafana running |

## Verification
```
$ curl -s localhost:9090/api/v1/targets   (summarised)
library-app  up  http://app:5000/metrics
prometheus   up  http://localhost:9090/metrics

$ curl -s localhost:3000/api/health
{"database": "ok", "version": "12.1.1", ...}
```

## Viva note (R4 question: why monitor, and Prometheus vs Grafana)
Monitoring tells the team whether the deployed application is up and how it behaves (traffic, errors,
response time) without waiting for users to report problems. Prometheus collects and stores the numbers:
every 5 seconds it pulls (scrapes) the `/metrics` page of the API and keeps them as time series.
Grafana does not store data; it queries Prometheus and draws dashboards from the results. Docker Compose
starts all three containers on one network with a single command, so the whole monitored deployment can be
reproduced on any machine.
