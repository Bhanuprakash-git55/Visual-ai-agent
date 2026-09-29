Backend (FastAPI)

Purpose
- FastAPI backend scaffolding for Visual AI Agent. No business logic is implemented here yet.

What is included
- app/main.py: FastAPI application entrypoint
- minimal router in api/v1 with a health endpoint
- core/config.py for settings
- database module placeholder
- requirements.txt with baseline dependencies

Run locally (development)
1. Create a virtual environment: python -m venv .venv
2. Activate it: .\.venv\Scripts\activate
3. Install dependencies: pip install -r requirements.txt
4. Create a backend/.env based on backend/.env.example
5. Start server (development): uvicorn app.main:app --reload --port 8000

Notes
- Database and migrations are placeholders. Use backend/app/database to add SQLAlchemy/asyncpg integration and Alembic for migrations.
