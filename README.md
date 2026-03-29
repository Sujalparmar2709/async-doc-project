Async Document Processing Workflow

A full-stack asynchronous document processing system built with FastAPI, Celery, PostgreSQL, Redis, and React.

Architecture Overview

This application implements a modern, decoupled asynchronous workflow:
1. Frontend (React/Vite): A Single Page Application that handles user uploads and provides real-time progress tracking via API polling.
2. Backend (FastAPI): Handles incoming HTTP requests, interacts with the database to create tracking records, and delegates heavy lifting to the background worker.
3. Database (PostgreSQL): Persists document metadata, job states (Queued, Processing, Completed, Finalized), and the final extracted JSON data.
4. Message Broker (Redis): Acts as the communication bridge, passing job IDs from the API to the background workers.
5. Background Worker (Celery): Picks up queued jobs, simulates heavy document extraction, and updates the database upon completion.

Run Steps (Setup Instructions)

Prerequisites
* Docker Desktop (for PostgreSQL & Redis)
* Python 3.10+
* Node.js & npm

Run Steps
(Note: You will need three separate terminal windows to run the application services).

1. Backend API (Terminal 1)
Navigate to the backend directory, create a virtual environment, install dependencies, and start the FastAPI server:


cd backend

# Activate the environment (Windows)
venv\Scripts\activate  
# (On Mac/Linux use: source venv/bin/activate)

pip install fastapi uvicorn sqlalchemy psycopg2-binary celery redis python-multipart pydantic
uvicorn main:app --reload

2. Background Worker (Terminal 2)
Open a new terminal in the backend directory, activate the virtual environment again, and start the Celery worker:


cd backend
venv\Scripts\activate  
celery -A worker worker --loglevel=info --pool=solo


3. Frontend Dashboard (Terminal 3)
Navigate to the frontend directory, install the Node dependencies, and run the development server:

cd frontend
npm install
npm run dev



