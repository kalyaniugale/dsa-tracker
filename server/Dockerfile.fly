# server/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# system deps for psycopg etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Fly provides $PORT at runtime; default to 8080 locally
ENV PORT=8080
CMD ["gunicorn", "--bind", "0.0.0.0:${PORT}", "config.wsgi:application"]
