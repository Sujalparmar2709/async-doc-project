#!/bin/bash
# Start the Celery worker in the background
celery -A worker worker --loglevel=info &
# Start the FastAPI cashier in the foreground
uvicorn main:app --host 0.0.0.0 --port $PORT