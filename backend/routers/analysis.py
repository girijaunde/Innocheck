from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.database.models import AnalysisResult, ProblemStatement

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/problem-results/{problem_id}")
def get_problem_result(
    problem_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    p = db.query(ProblemStatement).filter(ProblemStatement.id == problem_id).first()
    if not p or p.user_id != user_id:
        raise HTTPException(status_code=404, detail="Not found")
    ar = db.query(AnalysisResult).filter(AnalysisResult.problem_id == problem_id).first()
    if not ar:
        raise HTTPException(status_code=404, detail="No analysis stored")
    return ar.results_json
