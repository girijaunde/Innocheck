from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session

from backend.api.deps import get_db, get_optional_user_id
from backend.services.plagiarism_service import plagiarism_service

router = APIRouter(prefix="/api/plagiarism", tags=["plagiarism"])

MAX_PLAGIARISM_TEXT_LENGTH = 50000
MAX_PLAGIARISM_PROCESS_LENGTH = 15000


class PlagiarismCheckRequest(BaseModel):
    text: str = Field(..., min_length=50)
    sources: Optional[list[str]] = None  # e.g., ["devpost", "github", "arxiv", "semantic_scholar"]
    check_ai: Optional[bool] = False
    check_grammar: Optional[bool] = False

    @validator("text")
    def validate_text_length(cls, value: str) -> str:
        if len(value) > MAX_PLAGIARISM_TEXT_LENGTH:
            raise ValueError(
                f"Text exceeds maximum allowed length of {MAX_PLAGIARISM_TEXT_LENGTH} characters."
            )
        return value


@router.post("/check")
# @limiter.limit("10/minute") # Add limiter later if needed
def check_plagiarism_endpoint(
    request: Request,
    payload: PlagiarismCheckRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    sources = payload.sources or ["devpost", "github", "arxiv"]
    if "all" in sources:
        sources = ["devpost", "github", "arxiv"]

    processed_text = payload.text[:MAX_PLAGIARISM_PROCESS_LENGTH] if len(payload.text) > MAX_PLAGIARISM_PROCESS_LENGTH else payload.text
    
    # Use local PlagiarismService
    result = plagiarism_service.check_plagiarism(processed_text, db, threshold=0.85)

    ai_analysis = None
    if payload.check_ai:
        ai_analysis = plagiarism_service.analyze_ai_content(processed_text)

    response = {
        "success": True,
        "plagiarism_percentage": result["plagiarism_percentage"],
        "unique_percentage": result["unique_percentage"],
        "summary": result["summary"],
        "detected_issues": result["detected_issues"],
        "status": result["status"],
        "status_text": result["status_text"],
        "matched_sources": result["matches"],
        "sentences_analysis": result["sentences_analysis"],
        "highlighted_text": processed_text,
        "user_id": user_id,
        "ai_analysis": ai_analysis,
    }

    if len(payload.text) > 15000:
        response["warning"] = (
            "Input text was longer than 15000 characters and has been trimmed for processing."
        )

    return response
