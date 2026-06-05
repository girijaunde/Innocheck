from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_optional_user_id
from backend.database.models import Feedback

router = APIRouter(prefix="/api", tags=["feedback"])


class FeedbackBody(BaseModel):
    problem_id: Optional[int] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comments: Optional[str] = None


@router.post("/feedback")
def submit_feedback(
    body: FeedbackBody,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict:
    row = Feedback(
        user_id=user_id,
        problem_id=body.problem_id,
        rating=body.rating,
        comments=body.comments,
    )
    db.add(row)
    db.commit()
    return {"message": "Feedback saved"}
