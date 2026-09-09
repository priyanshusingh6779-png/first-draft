# Habit Tracker — Full Stack (React + FastAPI)

A complete habit tracker rebuilt with React + Vite frontend and FastAPI + SQLite backend.

## Project Structure
```
first-draft/
├── backend/          ← FastAPI Python backend
│   ├── main.py       ← All API routes
│   ├── models.py     ← SQLAlchemy DB models
│   ├── schemas.py    ← Pydantic schemas
│   ├── auth.py       ← JWT authentication
│   ├── database.py   ← DB connection (SQLite)
│   └── .env          ← Environment config
│
└── frontend/         ← React + Vite frontend
    └── src/
        ├── pages/    ← Login, Dashboard, TodoList, HabitStreak, WeeklyProgress, Insights
        ├── context/  ← AuthContext (JWT)
        ├── api/      ← Axios client
        └── components/ ← Navbar
```

## 🚀 How to Run

### Step 1 — Install Node.js (one time)
Download from: https://nodejs.org (LTS version)

### Step 2 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
API runs at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Step 3 — Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at: http://localhost:5173

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Backend | FastAPI + Python |
| Database | SQLite (auto-created, no setup needed) |
| Auth | JWT (python-jose + bcrypt) |
