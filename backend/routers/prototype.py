import os
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db, get_optional_user_id
from backend.database.models import PrototypeGeneration
from backend.rate_limit import limiter
from backend.services.prototype_generator import (
    explain_code,
    generate_prototype,
    list_templates_public,
    match_domain_from_text,
    refine_prototype,
)

router = APIRouter(prefix="/api/prototype", tags=["prototype"])


class GeneratePrototypeRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=4000)
    framework: str = "html"
    template_id: Optional[str] = None
    extra_context: Optional[str] = None
    auto_template: bool = True


class RefinePrototypeRequest(BaseModel):
    framework: str = "html"
    code: str = Field(..., min_length=10, max_length=100000)
    instruction: str = Field(..., min_length=2, max_length=2000)


class ExplainPrototypeRequest(BaseModel):
    code: str = Field(..., min_length=10, max_length=100000)


@router.get("/templates")
def prototype_templates() -> dict[str, Any]:
    return {"templates": list_templates_public()}


@router.post("/generate")
@limiter.limit("20/minute")
def prototype_generate(
    request: Request,
    payload: GeneratePrototypeRequest,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_optional_user_id),
) -> dict[str, Any]:
    desc = payload.description.strip()
    tpl = payload.template_id
    if payload.auto_template and not tpl:
        tpl = match_domain_from_text(desc)
    try:
        out = generate_prototype(desc, payload.framework, tpl, payload.extra_context)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Generation failed: {e!s}") from e
    key = os.getenv("GEMINI_API_KEY", "")
    out["gemini_configured"] = bool(key and key != "your_key_here")
    if user_id is not None:
        row = PrototypeGeneration(
            user_id=user_id,
            description=desc,
            framework=out["framework"],
            template_id=out.get("template_id"),
            results_json=out,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        out["id"] = row.id
    return out


@router.post("/refine")
@limiter.limit("30/minute")
def prototype_refine(request: Request, payload: RefinePrototypeRequest) -> dict[str, Any]:
    try:
        return refine_prototype(payload.framework, payload.code, payload.instruction)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Refine failed: {e!s}") from e


@router.post("/explain")
@limiter.limit("30/minute")
def prototype_explain(request: Request, payload: ExplainPrototypeRequest) -> dict[str, Any]:
    try:
        return explain_code(payload.code)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Explain failed: {e!s}") from e


@router.get("/saved/{proto_id}")
def get_saved_prototype(
    proto_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = db.query(PrototypeGeneration).filter(PrototypeGeneration.id == proto_id).first()
    if not row or row.user_id != user_id:
        raise HTTPException(status_code=404, detail="Not found")
    out = dict(row.results_json)
    out["id"] = row.id
    return out


@router.get("/history/me")
def prototype_history_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    rows = (
        db.query(PrototypeGeneration)
        .filter(PrototypeGeneration.user_id == user_id)
        .order_by(PrototypeGeneration.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "description": r.description[:200],
                "framework": r.framework,
                "template_id": r.template_id,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }
