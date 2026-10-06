# Stage 1: build the React frontend
FROM node:22-alpine AS frontend

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Flask API that also serves the built frontend at /ui/
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first so this layer is cached between builds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py error_log.py ./
COPY --from=frontend /frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["python", "app.py"]
