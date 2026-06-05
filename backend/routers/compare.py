from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.services.comparison import compare_ideas

router = APIRouter(prefix="/api/compare", tags=["compare"])


class CompareRequest(BaseModel):
    problem_ids: list[int] = Field(..., min_length=2, max_length=3)


@router.post("")
def compare_saved_ideas(
    body: CompareRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return compare_ideas(db, user_id, body.problem_ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
