import sqlite3
from typing import Any, Dict
from sqlalchemy.orm import Session
from backend.database.models import AnalysisResult, ProblemStatement
from backend.services.plagiarism_service import plagiarism_service
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from io import BytesIO

DB_PATH = "innocheck.db"

def fetch_saved_papers() -> list:
    conn = sqlite3.connect(DB_PATH)
    try:
        rows = conn.execute("SELECT paper_title, paper_authors, paper_year, paper_doi, paper_url FROM saved_papers ORDER BY saved_at DESC").fetchall()
        return [{"title": r[0], "authors": r[1], "year": r[2], "doi": r[3], "url": r[4]} for r in rows]
    except Exception:
        return []
    finally:
        conn.close()

def generate_comprehensive_report(db: Session, user_id: int, problem_id: int) -> dict:
    row = (
        db.query(ProblemStatement, AnalysisResult)
        .join(AnalysisResult, AnalysisResult.problem_id == ProblemStatement.id)
        .filter(ProblemStatement.user_id == user_id, ProblemStatement.id == problem_id)
        .first()
    )
    if not row:
        raise ValueError("Idea analysis not found.")
    
    problem, analysis = row
    idea_data = analysis.results_json
    idea_text = problem.text

    # 1. Saved Literature
    saved_papers = fetch_saved_papers()

    # 2. Plagiarism Check
    # We re-run plagiarism locally on the idea text to bundle it directly.
    plagiarism_results = plagiarism_service.check_plagiarism(idea_text, db)

    # 3. Markdown Generation
    md = f"# Comprehensive Project Report\n\n"
    md += f"## 1. Idea Validation\n\n**Idea Statement:**\n> {idea_text}\n\n"
    md += f"**Uniqueness Score:** {idea_data.get('uniqueness_score')}/100\n"
    md += f"**Status:** {idea_data.get('score_label')}\n\n"
    md += f"### Innovation Gaps\n"
    for gap in idea_data.get("innovation_gaps", []):
        md += f"- **{gap.get('title')}**: {gap.get('opportunity')}\n"
    
    md += "\n## 2. Plagiarism Report\n\n"
    md += f"**Plagiarism Score:** {plagiarism_results.get('plagiarism_percentage')}%\n"
    md += f"**Unique Content:** {plagiarism_results.get('unique_percentage')}%\n"
    md += f"**Status:** {plagiarism_results.get('status_text')}\n\n"
    if plagiarism_results.get('matches'):
        md += "### Key Matches\n"
        for m in plagiarism_results.get('matches')[:5]:
            md += f"- Matched **{m.get('similarity_score')}%** from *{m.get('source_title')}*\n"
    else:
        md += "No significant matches found. The content is highly unique.\n"

    md += "\n## 3. Literature Review (Saved Papers)\n\n"
    if saved_papers:
        for i, paper in enumerate(saved_papers, 1):
            md += f"{i}. **{paper['title']}** ({paper['year']}) - {paper['authors']}\n"
    else:
        md += "No saved papers.\n"

    # 4. PDF Generation (using reportlab)
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 18 * mm

    def write_line(text: str, size: int = 11, gap: float = 6.5, bold: bool = False):
        nonlocal y
        if y < 16 * mm:
            pdf.showPage()
            y = height - 18 * mm
        font = "Helvetica-Bold" if bold else "Helvetica"
        pdf.setFont(font, size)
        
        raw = " ".join(str(text).split())
        words = raw.split(" ")
        lines = []
        current = ""
        for word in words:
            candidate = word if not current else f"{current} {word}"
            if len(candidate) <= 90:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current: lines.append(current)
        
        for line in lines:
            if y < 16 * mm:
                pdf.showPage()
                pdf.setFont(font, size)
                y = height - 18 * mm
            pdf.drawString(16 * mm, y, line)
            y -= gap * mm

    write_line("Comprehensive Project Report", size=18, gap=10, bold=True)
    
    write_line("1. Idea Validation", size=14, gap=8, bold=True)
    write_line(f"Idea: {idea_text[:250]}{'...' if len(idea_text) > 250 else ''}", size=11)
    write_line(f"Uniqueness: {idea_data.get('uniqueness_score')}/100 - {idea_data.get('score_label')}")
    
    write_line("Innovation Gaps:", size=12, gap=6, bold=True)
    for gap in idea_data.get("innovation_gaps", []):
        write_line(f"- {gap.get('title')}: {gap.get('opportunity')}")

    write_line("2. Plagiarism Report", size=14, gap=8, bold=True)
    write_line(f"Plagiarism Score: {plagiarism_results.get('plagiarism_percentage')}%")
    write_line(f"Unique Content: {plagiarism_results.get('unique_percentage')}%")
    if plagiarism_results.get('matches'):
        write_line("Key Matches:", size=12, gap=6, bold=True)
        for m in plagiarism_results.get('matches')[:5]:
            write_line(f"- {m.get('similarity_score')}% from {m.get('source_title')}")
    else:
        write_line("No significant matches found.")

    write_line("3. Literature Review (Saved Papers)", size=14, gap=8, bold=True)
    if saved_papers:
        for i, paper in enumerate(saved_papers, 1):
            write_line(f"{i}. {paper['title']} ({paper['year']}) - {paper['authors']}")
    else:
        write_line("No saved papers.")

    pdf.save()

    return {
        "markdown": md,
        "pdf_bytes": buffer.getvalue()
    }
