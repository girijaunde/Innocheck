from datetime import datetime
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db, get_optional_user_id
from backend.database.models import AnalysisResult, ChatSession, ProblemStatement, UserHistory
from backend.rate_limit import limiter
from backend.services.validation_service import build_analysis

router = APIRouter(prefix="/api", tags=["validate"])

Mode = Literal["full", "uniqueness", "gaps", "similar", "suggestion", "literature"]


class ValidateRequest(BaseModel):
    problem_statement: str = Field(..., min_length=15, max_length=500)
    suggestions: Optional[str] = Field(default="", max_length=500)
    session_id: Optional[int] = None
    mode: Mode = "full"


def _ensure_session(
    db: Session,
    user_id: int,
    session_id: Optional[int],
    first_line: str,
) -> ChatSession:
    if session_id is not None:
        s = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
        if not s:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        if not s.title:
            s.title = (first_line[:50] + "…") if len(first_line) > 50 else first_line
            s.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(s)
        return s
    title = (first_line[:50] + "…") if len(first_line) > 50 else first_line
    s = ChatSession(user_id=user_id, title=title, updated_at=datetime.utcnow())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.post("/validate")
@limiter.limit("40/minute")
def validate_idea(
    request: Request,
    payload: ValidateRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    query = payload.problem_statement.strip()
    suggestions = payload.suggestions.strip() if payload.suggestions else ""
    if not query:
        raise HTTPException(status_code=400, detail="Problem statement is required.")

    try:
        output = build_analysis(query, db, mode=payload.mode, suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Analysis failed: {e!s}") from e

    if user_id is None:
        output["saved"] = False
        return output

    s = _ensure_session(db, user_id, payload.session_id, query)
    problem = ProblemStatement(
        user_id=user_id,
        session_id=s.id,
        text=query,
        uniqueness_score=float(output.get("uniqueness_score", 0)),
    )
    db.add(problem)
    s.updated_at = datetime.utcnow()
    db.add(UserHistory(user_id=user_id, idea=query))
    db.commit()
    db.refresh(problem)

    db.add(AnalysisResult(problem_id=problem.id, results_json=output))
    db.commit()
    output["problem_id"] = problem.id
    output["session_id"] = s.id
    output["saved"] = True
    return output


@router.get("/history/me")
def history_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    rows = (
        db.query(ProblemStatement)
        .filter(ProblemStatement.user_id == user_id)
        .order_by(ProblemStatement.submitted_at.desc())
        .limit(50)
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "text": r.text,
                "session_id": r.session_id,
                "submitted_at": r.submitted_at.isoformat(),
                "uniqueness_score": r.uniqueness_score,
            }
            for r in rows
        ]
    }
