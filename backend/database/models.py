from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    college = Column(String(200), nullable=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    problem_statements = relationship("ProblemStatement", back_populates="user")
    history = relationship("UserHistory", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    student_projects = relationship("StudentProject", back_populates="user")
    codestudio_sessions = relationship("CodeStudioSession", back_populates="user")


class ChatSession(Base):
    """Conversation thread for sidebar history."""

    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ProblemStatement", back_populates="session")


class ProblemStatement(Base):
    __tablename__ = "problem_statements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True, index=True)
    text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uniqueness_score = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="problem_statements")
    session = relationship("ChatSession", back_populates="messages")
    analysis = relationship("AnalysisResult", back_populates="problem", uselist=False)


class StudentProject(Base):
    __tablename__ = "student_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    framework = Column(String(50), nullable=False)
    code = Column(Text, nullable=True)
    files = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    is_public = Column(Boolean, default=False, nullable=False)
    fork_from = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="student_projects")


class CodeStudioSession(Base):
    __tablename__ = "codestudio_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="codestudio_sessions")
    messages = relationship("CodeStudioMessage", back_populates="session")


class CodeStudioMessage(Base):
    __tablename__ = "codestudio_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("codestudio_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("CodeStudioSession", back_populates="messages")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problem_statements.id"), nullable=False, unique=True)
    results_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    problem = relationship("ProblemStatement", back_populates="analysis")


class UserHistory(Base):
    __tablename__ = "user_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    idea = Column(Text, nullable=False)
    validated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="history")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    problem_id = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PrototypeGeneration(Base):
    __tablename__ = "prototype_generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    description = Column(Text, nullable=False)
    framework = Column(String(32), nullable=False)
    template_id = Column(String(64), nullable=True)
    results_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Project(Base):
    """Real-world projects from APIs and user submissions"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=True)
    source = Column(String(100), nullable=False)  # arXiv, GitHub, Devpost, etc.
    url = Column(String(1000), nullable=True)
    known_gap = Column(Text, nullable=True)
    tech_stack = Column(JSON, nullable=True)  # List of technologies
    similarity_keywords = Column(JSON, nullable=True)  # Keywords for matching
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
