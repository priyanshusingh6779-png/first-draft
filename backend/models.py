from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    habits = relationship("Habit", back_populates="owner", cascade="all, delete")
    tasks = relationship("Task", back_populates="owner", cascade="all, delete")

class Admin(Base):
    __tablename__ = "admins"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)

    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=True) # Explicitly True for Admins
    created_at = Column(DateTime(timezone=True), server_default=func.now())




class Habit(Base):
    __tablename__ = "habits"

    habit_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    points = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete")


class HabitLog(Base):
    __tablename__ = "habit_log"

    log_id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.habit_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)

    habit = relationship("Habit", back_populates="logs")


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    points = Column(Integer, default=0)
    task_date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="tasks")
