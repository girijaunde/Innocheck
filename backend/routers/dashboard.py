from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.database.models import UserHistory
from backend.services.dashboard import build_dashboard

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
def dashboard_overview(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return build_dashboard(db, user_id)


@router.get("/history/me")
def get_user_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Get user's validation history"""
    history = db.query(UserHistory).filter(UserHistory.user_id == user_id).order_by(UserHistory.created_at.desc()).limit(10).all()
    
    return {
        "history": [
            {
                "id": h.id,
                "problem_statement": h.problem_statement,
                "uniqueness_score": h.uniqueness_score,
                "score_label": h.score_label,
                "created_at": h.created_at.isoformat(),
            }
            for h in history
        ],
        "total_count": db.query(UserHistory).filter(UserHistory.user_id == user_id).count()
    }
