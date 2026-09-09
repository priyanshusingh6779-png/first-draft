from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date, timedelta
from typing import List
import os, json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)


import models, schemas, auth
import google.generativeai as genai
from database import engine, get_db

# Create all tables
models.Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    conn.execute(text("DROP VIEW IF EXISTS admin_users_view;"))
    conn.execute(text("DROP VIEW IF EXISTS habit_streak_view;"))
    conn.execute(text("DROP VIEW IF EXISTS habit_all_streaks;"))
    conn.execute(text("DROP VIEW IF EXISTS habit_streak_groups;"))
    conn.execute(text("DROP VIEW IF EXISTS user_insights_view;"))
    conn.execute(text("DROP VIEW IF EXISTS daily_scores_view;"))
    
    conn.execute(text("""
        CREATE VIEW daily_scores_view AS

        SELECT user_id, score_date, SUM(points) as total_score
        FROM (
            SELECT hl.user_id, hl.log_date as score_date, h.points
            FROM habit_log hl
            JOIN habits h ON hl.habit_id = h.habit_id
            WHERE hl.completed = 1
            UNION ALL
            SELECT user_id, task_date as score_date, points
            FROM tasks
            WHERE completed = 1
        )
        GROUP BY user_id, score_date;
    """))
    conn.execute(text("""
        CREATE VIEW user_insights_view AS

        SELECT 
            u.user_id,
            COALESCE(w.weekly_total, 0) as weekly_total,
            CASE 
                WHEN COALESCE(w.weekly_total, 0) > 50 THEN '🔥 Excellent week! Your habits are strongly positive. Keep it up!'
                WHEN COALESCE(w.weekly_total, 0) > 0 THEN '📈 Moderate performance. Try to stay more consistent this week.'
                ELSE '⚠️ Negative or zero score. Review your habits and set easier, positive goals.'
            END as message,
            CASE 
                WHEN COALESCE(w.weekly_total, 0) > 50 THEN 'great'
                WHEN COALESCE(w.weekly_total, 0) > 0 THEN 'moderate'
                ELSE 'poor'
            END as level
        FROM users u
        LEFT JOIN (
            SELECT user_id, SUM(total_score) as weekly_total
            FROM daily_scores_view
            WHERE score_date > date('now', 'localtime', '-7 days')
            GROUP BY user_id
        ) w ON u.user_id = w.user_id;
    """))

    conn.execute(text("""
        CREATE VIEW habit_streak_groups AS

        SELECT 
            habit_id,
            log_date,
            date(log_date, '-' || ROW_NUMBER() OVER (PARTITION BY habit_id ORDER BY log_date) || ' days') as grp
        FROM habit_log
        WHERE completed = 1;
    """))
    
    conn.execute(text("""
        CREATE VIEW habit_all_streaks AS

        SELECT 
            habit_id,
            grp,
            MIN(log_date) as start_date,
            MAX(log_date) as end_date,
            COUNT(*) as streak_length
        FROM habit_streak_groups
        GROUP BY habit_id, grp;
    """))

    conn.execute(text("""
        CREATE VIEW habit_streak_view AS

        SELECT 
            h.habit_id,
            COALESCE(MAX(s.streak_length), 0) as longest_streak,
            COALESCE(
                (SELECT streak_length 
                 FROM habit_all_streaks 
                 WHERE habit_id = h.habit_id 
                   AND (end_date = date('now', 'localtime') OR end_date = date('now', 'localtime', '-1 day'))
                 ORDER BY end_date DESC LIMIT 1
                ), 0) as current_streak
        FROM habits h
        LEFT JOIN habit_all_streaks s ON h.habit_id = s.habit_id
        GROUP BY h.habit_id;
    """))
    
    conn.execute(text("""
        CREATE VIEW admin_users_view AS

        SELECT 
            u.user_id,
            u.username,
            u.email,
            COALESCE(v.weekly_total, 0) as weekly_total,
            COALESCE(v.level, 'poor') as level,
            COALESCE(v.message, '⚠️ Negative or zero score...') as message,
            (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.user_id AND t.completed = 1 AND t.task_date > date('now', 'localtime', '-7 days')) as tasks_completed
        FROM users u
        LEFT JOIN user_insights_view v ON u.user_id = v.user_id;
    """))
    conn.commit()


# Ensure default admin exists
from database import SessionLocal
import os
db_session = SessionLocal()
try:
    # Get desired admin username from some config or use default
    DEFAULT_ADMIN_USER = "Yatharth" 
    admin_user = db_session.query(models.Admin).filter(models.Admin.username == DEFAULT_ADMIN_USER).first()
    if not admin_user:
        print(f"Creating default admin: {DEFAULT_ADMIN_USER}")
        hashed_admin_pw = auth.hash_password("admin") # Default password is 'admin'
        new_admin = models.Admin(username=DEFAULT_ADMIN_USER, email="yatharth@gmail.com", password_hash=hashed_admin_pw)
        db_session.add(new_admin)
        db_session.commit()
    else:
        print(f"Default admin {DEFAULT_ADMIN_USER} already exists.")

finally:
    db_session.close()


app = FastAPI(title="Habit Tracker API", version="1.0.0")

# Allow React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
#  AUTH ROUTES
# ─────────────────────────────────────────

@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=201)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    ADMIN_REGISTRATION_SECRET = os.getenv("ADMIN_REGISTRATION_SECRET", "1234567890")

    if user_in.role == "admin":
        if user_in.admin_secret != ADMIN_REGISTRATION_SECRET:
            raise HTTPException(status_code=403, detail="Invalid Admin Secret Code.")
        
        # Check if username exists in EITHER table
        if db.query(models.Admin).filter(models.Admin.username == user_in.username).first() or \
           db.query(models.User).filter(models.User.username == user_in.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
            
        hashed_pw = auth.hash_password(user_in.password)
        new_admin = models.Admin(
            username=user_in.username, 
            email=user_in.email,        # Now saving email
            password_hash=hashed_pw
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        return new_admin


    # Check if username exists in EITHER table for normal users too
    if db.query(models.User).filter(models.User.username == user_in.username).first() or \
       db.query(models.Admin).filter(models.Admin.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

        
    hashed_pw = auth.hash_password(user_in.password)
    new_user = models.User(username=user_in.username, email=user_in.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user



@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # First check User table
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if user and auth.verify_password(form_data.password, user.password_hash):
        token = auth.create_access_token(data={"sub": user.username, "is_admin": False})
        return {"access_token": token, "token_type": "bearer"}
    
    # Then check Admin table
    admin = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    if admin and auth.verify_password(form_data.password, admin.password_hash):
        token = auth.create_access_token(data={"sub": admin.username, "is_admin": True})
        return {"access_token": token, "token_type": "bearer"}
        
    raise HTTPException(status_code=401, detail="Invalid username or password")



@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ─────────────────────────────────────────
#  HABIT ROUTES
# ─────────────────────────────────────────

def _get_habit_with_streak(habit: models.Habit, db: Session) -> dict:
    streak_row = db.execute(text("SELECT current_streak, longest_streak FROM habit_streak_view WHERE habit_id = :id"), {"id": habit.habit_id}).fetchone()
    res = {
        "habit_id": habit.habit_id,
        "name": habit.name,
        "points": habit.points,
        "is_active": habit.is_active,
        "current_streak": streak_row.current_streak if streak_row else 0,
        "longest_streak": streak_row.longest_streak if streak_row else 0,
    }
    res["sql_query"] = f"SELECT current_streak, longest_streak FROM habit_streak_view WHERE habit_id = {habit.habit_id};"
    return res

@app.get("/api/habits", response_model=List[schemas.HabitOut])
def get_habits(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    habits = db.query(models.Habit).filter(
        models.Habit.user_id == current_user.user_id,
        models.Habit.is_active == True
    ).all()
    return [_get_habit_with_streak(h, db) for h in habits]


@app.post("/api/habits", response_model=schemas.HabitOut, status_code=201)
def create_habit(
    habit_in: schemas.HabitCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    habit = models.Habit(
        user_id=current_user.user_id,
        name=habit_in.name,
        points=habit_in.points
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    result = _get_habit_with_streak(habit, db)
    result["sql_query"] = f"INSERT INTO habits (user_id, name, points, is_active) VALUES ({current_user.user_id}, '{habit_in.name}', {habit_in.points}, 1);"
    return result


@app.post("/api/habits/{habit_id}/complete", response_model=schemas.HabitOut)
def complete_habit(
    habit_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(models.Habit).filter(
        models.Habit.habit_id == habit_id,
        models.Habit.user_id == current_user.user_id
    ).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    today = date.today()

    # Check if already completed today
    existing_log = db.query(models.HabitLog).filter(
        models.HabitLog.habit_id == habit_id,
        models.HabitLog.log_date == today
    ).first()
    if existing_log and existing_log.completed:
        raise HTTPException(status_code=400, detail="Habit already completed today")

    # Log it
    if existing_log:
        existing_log.completed = True
    else:
        log = models.HabitLog(habit_id=habit_id, user_id=current_user.user_id,
                               log_date=today, completed=True)
        db.add(log)

    db.commit()
    db.refresh(habit)
    result = _get_habit_with_streak(habit, db)
    if existing_log:
        result["sql_query"] = f"UPDATE habit_log SET completed = 1 WHERE habit_id = {habit_id} AND log_date = '{today}';"
    else:
        result["sql_query"] = f"INSERT INTO habit_log (habit_id, user_id, log_date, completed) VALUES ({habit_id}, {current_user.user_id}, '{today}', 1);"
    return result


@app.delete("/api/habits/{habit_id}", status_code=204)
def delete_habit(
    habit_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(models.Habit).filter(
        models.Habit.habit_id == habit_id,
        models.Habit.user_id == current_user.user_id
    ).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.is_active = False
    db.commit()


# ─────────────────────────────────────────
#  TASK ROUTES
# ─────────────────────────────────────────

@app.get("/api/tasks", response_model=List[schemas.TaskOut])
def get_tasks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.user_id,
        models.Task.task_date == today
    ).all()
    return tasks


@app.post("/api/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = models.Task(
        user_id=current_user.user_id,
        name=task_in.name,
        points=task_in.points,
        task_date=date.today()
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    # Convert to dict to add sql_query
    task_out = schemas.TaskOut.from_orm(task)
    task_out.sql_query = f"INSERT INTO tasks (user_id, name, points, task_date, completed) VALUES ({current_user.user_id}, '{task_in.name}', {task_in.points}, '{date.today()}', 0);"
    return task_out


@app.patch("/api/tasks/{task_id}/complete", response_model=schemas.TaskOut)
def complete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(
        models.Task.task_id == task_id,
        models.Task.user_id == current_user.user_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    task_out = schemas.TaskOut.from_orm(task)
    task_out.sql_query = f"UPDATE tasks SET completed = {1 if task.completed else 0} WHERE task_id = {task_id};"
    return task_out


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(
        models.Task.task_id == task_id,
        models.Task.user_id == current_user.user_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()

#  PROGRESS & INSIGHTS ROUTES

@app.get("/api/progress/weekly", response_model=schemas.WeeklyProgressOut)
def get_weekly_progress(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    start_date = today - timedelta(days=6)
    
    records = db.execute(text("""
        SELECT score_date, total_score 
        FROM daily_scores_view 
        WHERE user_id = :uid AND score_date >= :start_date
    """), {"uid": current_user.user_id, "start_date": start_date}).fetchall()
    
    score_map = {str(r.score_date): r.total_score for r in records}
    
    breakdown = []
    total = sum(score_map.values())
    
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = str(day)
        day_score = score_map.get(day_str, 0)
        breakdown.append(schemas.DayScore(date=day.strftime("%a"), score=day_score))

    sql = f"""
        SELECT score_date, total_score 
        FROM daily_scores_view 
        WHERE user_id = {current_user.user_id} AND score_date >= '{start_date}';
    """
    return schemas.WeeklyProgressOut(total_weekly_score=total, daily_breakdown=breakdown, sql_query=sql.strip())


@app.get("/api/insights", response_model=schemas.InsightOut)
def get_insights(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    record = db.execute(text("""
        SELECT weekly_total, message, level 
        FROM user_insights_view 
        WHERE user_id = :uid
    """), {"uid": current_user.user_id}).fetchone()
    
    if not record:
        return schemas.InsightOut(score=0, message="⚠️ Negative or zero score. Review your habits and set easier, positive goals.", level="poor")

    return schemas.InsightOut(score=record.weekly_total, message=record.message, level=record.level)


@app.get("/api/insights/recommendations")
def get_ai_recommendations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI recommendations are not configured. Please add your GEMINI_API_KEY to backend/.env"
        )

    # Gather user context
    record = db.execute(text("""
        SELECT weekly_total, level FROM user_insights_view WHERE user_id = :uid
    """), {"uid": current_user.user_id}).fetchone()

    level = record.level if record else "poor"
    weekly_score = record.weekly_total if record else 0

    habits = db.query(models.Habit).filter(
        models.Habit.user_id == current_user.user_id,
        models.Habit.is_active == True
    ).all()
    habit_names = [h.name for h in habits] if habits else []

    # Build Gemini prompt
    habits_str = ", ".join(habit_names) if habit_names else "no specific habits tracked"
    prompt = f"""You are a helpful productivity coach. A user is tracking their habits and tasks.

Current performance level: {level} (weekly score: {weekly_score} points)
Their tracked habits: {habits_str}

Based on this, suggest 5 YouTube video searches that would help them improve or stay motivated.
- If level is "poor" or "moderate": focus on beginner-friendly tutorials and motivation for their specific habits.
- If level is "great": suggest advanced tips, challenge videos, or inspiring content.
- Always include at least one motivational video.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{{"recommendations": [
  {{"title": "short descriptive title", "search_query": "exact youtube search query", "reason": "1 short sentence why this helps"}},
  ...
]}}"""
    genai.configure(api_key=api_key)

    try:
        # Automatically discover the best available model to avoid 404s
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        # Try to find gemini-1.5-flash, then gemini-1.5-flash-latest, then any flash, then first available
        selected_model = "gemini-1.5-flash" 
        for m in available_models:
            if "gemini-1.5-flash" in m:
                selected_model = m
                break
        else:
            if available_models:
                selected_model = available_models[0]
        
        model = genai.GenerativeModel(selected_model)

        print(f"AI Response received for {current_user.username}")
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)
        recs = parsed.get("recommendations", [])
        # Build YouTube search URLs
        for r in recs:
            query = r.get("search_query", r.get("title", ""))
            r["search_url"] = "https://www.youtube.com/results?search_query=" + query.replace(" ", "+")
        print(f"Returning {len(recs)} AI recommendations.")
        return {"recommendations": recs}
    except json.JSONDecodeError:
        print("AI returned invalid JSON")
        raise HTTPException(status_code=500, detail="AI returned an unexpected response. Please try again.")
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# ─────────────────────────────────────────
#  PUBLIC PROGRESS ROUTE (SHAREABLE LINK)
# ─────────────────────────────────────────
@app.get("/api/public/progress/{username}")
def get_public_progress(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    today = date.today()
    start_date = today - timedelta(days=6)
    
    records = db.execute(text("""
        SELECT score_date, total_score 
        FROM daily_scores_view 
        WHERE user_id = :uid AND score_date >= :start_date
    """), {"uid": user.user_id, "start_date": start_date}).fetchall()
    
    score_map = {str(r.score_date): r.total_score for r in records}
    
    breakdown = []
    total = sum(score_map.values())
    
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = str(day)
        day_score = score_map.get(day_str, 0)
        breakdown.append(schemas.DayScore(date=day.strftime("%a"), score=day_score).dict())
        
    # Get insights
    record = db.execute(text("""
        SELECT weekly_total, message, level 
        FROM user_insights_view 
        WHERE user_id = :uid
    """), {"uid": user.user_id}).fetchone()
    
    insights = {
        "score": record.weekly_total if record else 0,
        "message": record.message if record else "⚠️ Negative or zero score.",
        "level": record.level if record else "poor"
    }

    return {
        "username": username,
        "weekly_progress": {
            "total_weekly_score": total,
            "daily_breakdown": breakdown
        },
        "insights": insights
    }


# ─────────────────────────────────────────
#  ADMIN ROUTES
# ─────────────────────────────────────────
@app.get("/api/admin/users", response_model=List[schemas.AdminUserViewOut])
def get_all_users_admin(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
        
    records = db.execute(text("SELECT * FROM admin_users_view")).fetchall()
    # Convert records to list of dicts and add the view definition
    results = []
    for r in records:
        d = dict(r._mapping)
        d["sql_query"] = "SELECT * FROM admin_users_view; -- This view joins users, habits, and tasks to calculate progress."
        results.append(d)
    return results


@app.get("/")
def root():
    return {"message": "Habit Tracker API is running. Visit /docs for Swagger UI."}
