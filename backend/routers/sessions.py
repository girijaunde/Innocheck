from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.database.models import AnalysisResult, ChatSession, ProblemStatement

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    title: str | None = Field(None, max_length=200)


@router.post("")
def create_session(
    body: SessionCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    s = ChatSession(user_id=user_id, title=body.title, updated_at=datetime.utcnow())
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()}


@router.get("")
def list_sessions(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)) -> dict:
    rows = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
        .limit(100)
        .all()
    )
    items = []
    for s in rows:
        last = (
            db.query(ProblemStatement)
            .filter(ProblemStatement.session_id == s.id)
            .order_by(ProblemStatement.submitted_at.desc())
            .first()
        )
        preview = (last.text[:80] + "…") if last and len(last.text) > 80 else (last.text if last else "")
        items.append(
            {
                "id": s.id,
                "title": s.title or (preview or "New chat"),
                "preview": preview,
                "updated_at": s.updated_at.isoformat() if s.updated_at else s.created_at.isoformat(),
            }
        )
    return {"items": items}


@router.get("/{session_id}/messages")
def session_messages(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    problems = (
        db.query(ProblemStatement)
        .filter(ProblemStatement.session_id == session_id)
        .order_by(ProblemStatement.submitted_at.asc())
        .all()
    )
    return {
        "session_id": session_id,
        "items": [
            {
                "id": p.id,
                "text": p.text,
                "submitted_at": p.submitted_at.isoformat(),
                "uniqueness_score": p.uniqueness_score,
            }
            for p in problems
        ],
    }


@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    problems = db.query(ProblemStatement).filter(ProblemStatement.session_id == session_id).all()
    for p in problems:
        db.query(AnalysisResult).filter(AnalysisResult.problem_id == p.id).delete(synchronize_session=False)
        db.delete(p)
    db.delete(s)
    db.commit()
    return {"ok": True}
