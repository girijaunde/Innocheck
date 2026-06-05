from __future__ import annotations

from io import BytesIO
from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import AnalysisResult, ProblemStatement


def _citation_bibtex(item: dict[str, Any], index: int) -> str:
    key = f"innocheck{index}"
    title = item.get("title", "Untitled").replace("{", "").replace("}", "")
    year = item.get("year") or "n.d."
    source = item.get("venue") or item.get("source") or "Unknown"
    url = item.get("url") or ""
    return (
        f"@article{{{key},\n"
        f"  title = {{{title}}},\n"
        f"  journal = {{{source}}},\n"
        f"  year = {{{year}}},\n"
        f"  url = {{{url}}}\n"
        f"}}"
    )


def citations_as_bibtex(similar_papers: list[dict[str, Any]]) -> str:
    if not similar_papers:
        return ""
    return "\n\n".join(_citation_bibtex(item, idx + 1) for idx, item in enumerate(similar_papers))


def load_report_payload(db: Session, user_id: int, problem_id: int) -> dict[str, Any]:
    row = (
        db.query(ProblemStatement, AnalysisResult)
        .join(AnalysisResult, AnalysisResult.problem_id == ProblemStatement.id)
        .filter(ProblemStatement.user_id == user_id, ProblemStatement.id == problem_id)
        .first()
    )
    if row is None:
        raise ValueError("Analysis report not found.")
    problem, analysis = row
    payload = dict(analysis.results_json)
    payload["problem_id"] = problem.id
    payload["problem_statement"] = problem.text
    return payload


def render_report_pdf(payload: dict[str, Any]) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 18 * mm

    def write_line(text: str, size: int = 11, gap: float = 6.5) -> None:
        nonlocal y
        pdf.setFont("Helvetica", size)
        for chunk in _wrap_text(text, width=96):
            if y < 16 * mm:
                pdf.showPage()
                pdf.setFont("Helvetica", size)
                y = height - 18 * mm
            pdf.drawString(16 * mm, y, chunk)
            y -= gap * mm

    pdf.setTitle("InnoCheck Analysis Report")
    write_line("InnoCheck Analysis Report", size=15, gap=7)
    write_line(f"Idea: {payload.get('problem_statement', '')}", size=11)
    write_line(
        f"Uniqueness: {payload.get('uniqueness_score', 'N/A')} | Label: {payload.get('score_label', 'N/A')}",
        size=11,
    )
    write_line(payload.get("score_description", ""), size=10)

    dims = payload.get("dimensions", {})
    if dims:
        write_line(
            "Dimensions: "
            f"Novelty {dims.get('novelty', 'N/A')}, "
            f"Feasibility {dims.get('feasibility', 'N/A')}, "
            f"Impact {dims.get('impact', 'N/A')}, "
            f"Market Gap {dims.get('market_gap', 'N/A')}",
            size=10,
        )

    write_line("Innovation Gaps", size=13, gap=7)
    for gap in payload.get("innovation_gaps", []):
        write_line(f"- {gap.get('title', 'Gap')}: {gap.get('opportunity', '')}", size=10)

    write_line("Similar Papers", size=13, gap=7)
    for paper in payload.get("similar_papers", [])[:8]:
        write_line(
            f"- {paper.get('title', 'Untitled')} ({paper.get('year', 'N/A')}) [{paper.get('similarity', 0)}%]",
            size=10,
        )

    suggestion = payload.get("unique_suggestion") or {}
    if suggestion:
        write_line("Unique Suggestion", size=13, gap=7)
        write_line(f"Title: {suggestion.get('title', '')}", size=10)
        write_line(f"Description: {suggestion.get('description', '')}", size=10)

    if payload.get("tech_stack"):
        write_line("Tech Stack", size=13, gap=7)
        for entry in payload["tech_stack"]:
            write_line(f"- {entry.get('category', '')}: {', '.join(entry.get('items', []))}", size=10)

    if payload.get("literature_review"):
        write_line("Literature Review", size=13, gap=7)
        write_line(str(payload["literature_review"]), size=10)

    bibtex = citations_as_bibtex(payload.get("similar_papers", []))
    if bibtex:
        write_line("BibTeX Citations", size=13, gap=7)
        write_line(bibtex, size=9, gap=5.5)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _wrap_text(text: str, width: int = 96) -> list[str]:
    raw = " ".join(str(text).split())
    if not raw:
        return [""]
    words = raw.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if len(candidate) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines
