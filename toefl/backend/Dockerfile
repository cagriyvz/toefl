# TOEFL Structure backend + statik uygulama (tek imaj)
FROM python:3.11-slim

WORKDIR /app

# Bağımlılıklar
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Backend + frontend (server.py, ".." üzerinden frontend'i servis eder)
COPY backend /app/backend
COPY index.html /app/index.html
COPY css /app/css
COPY js /app/js

WORKDIR /app/backend
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
