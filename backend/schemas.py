from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


# ── Auth ──────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"          # "user" or "admin"
    admin_secret: Optional[str] = None    # Required if role == "admin"


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    is_admin: bool = False
    class Config:
        from_attributes = True

class AdminUserViewOut(BaseModel):
    user_id: int
    username: str
    email: str
    weekly_total: int
    level: str
    message: str
    tasks_completed: int = 0
    sql_query: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


# ── Habits ────────────────────────────────────────────
class HabitCreate(BaseModel):
    name: str
    points: int = 1

class HabitOut(BaseModel):
    habit_id: int
    name: str
    points: int
    is_active: bool
    current_streak: int = 0
    longest_streak: int = 0
    sql_query: Optional[str] = None
    class Config:
        from_attributes = True


# ── Tasks ─────────────────────────────────────────────
class TaskCreate(BaseModel):
    name: str
    points: int = 0

class TaskOut(BaseModel):
    task_id: int
    name: str
    points: int
    completed: bool
    task_date: date
    sql_query: Optional[str] = None
    class Config:
        from_attributes = True


# ── Progress ──────────────────────────────────────────
class DayScore(BaseModel):
    date: str
    score: int

class WeeklyProgressOut(BaseModel):
    total_weekly_score: int
    daily_breakdown: list[DayScore]
    sql_query: Optional[str] = None

class InsightOut(BaseModel):
    score: int
    message: str
    level: str  # "great" | "moderate" | "poor"
    sql_query: Optional[str] = None
