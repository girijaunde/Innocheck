from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user_id, get_db
from backend.services.report_export import citations_as_bibtex, load_report_payload, render_report_pdf

router = APIRouter(prefix="/api/export", tags=["export"])


class ReportExportRequest(BaseModel):
    problem_id: int = Field(..., ge=1)


class CitationExportRequest(BaseModel):
    problem_id: int = Field(..., ge=1)


@router.post("/report")
def export_report(
    body: ReportExportRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Response:
    try:
        payload = load_report_payload(db, user_id, body.problem_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    try:
        pdf_bytes = render_report_pdf(payload)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="PDF export dependency is not installed.") from exc
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="innocheck-report-{body.problem_id}.pdf"'},
    )


@router.post("/citations")
def export_citations(
    body: CitationExportRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        payload = load_report_payload(db, user_id, body.problem_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"problem_id": body.problem_id, "bibtex": citations_as_bibtex(payload.get("similar_papers", []))}

@router.post("/comprehensive/md")
def export_comprehensive_md(
    body: ReportExportRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Response:
    from backend.services.report_generator import generate_comprehensive_report
    try:
        payload = generate_comprehensive_report(db, user_id, body.problem_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(
        content=payload["markdown"],
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="innocheck-comprehensive-{body.problem_id}.md"'},
    )

@router.post("/comprehensive/pdf")
def export_comprehensive_pdf(
    body: ReportExportRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Response:
    from backend.services.report_generator import generate_comprehensive_report
    try:
        payload = generate_comprehensive_report(db, user_id, body.problem_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(
        content=payload["pdf_bytes"],
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="innocheck-comprehensive-{body.problem_id}.pdf"'},
    )
