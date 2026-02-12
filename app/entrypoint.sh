#!/bin/sh
set -e

echo "[Entrypoint] Making migrations..."
python manage.py makemigrations --noinput

echo "[Entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[Entrypoint] Setting up TimescaleDB..."
python manage.py setup_timescale || echo "[Entrypoint] TimescaleDB setup skipped (may already be configured)"

echo "[Entrypoint] Seeding data..."
python manage.py seed

echo "[Entrypoint] Starting sensor listener in background..."
python manage.py sensor_listener &

echo "[Entrypoint] Starting Daphne ASGI server..."
exec daphne -b 0.0.0.0 -p 8000 core.asgi:application
