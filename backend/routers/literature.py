import json
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.arxiv_service import search_arxiv
from backend.services.literature_service import literature_service

router = APIRouter(prefix="/api/literature", tags=["literature"])

DB_PATH = Path(__file__).resolve().parents[2] / "innocheck.db"
SAMPLE_PAPERS_PATH = Path(__file__).resolve().parents[2] / "data" / "sample_projects.json"


class LiteratureSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200)
    year_from: int = 2020
    year_to: int = 2026
    source: str = "all"

class SummarizeRequest(BaseModel):
    title: str
    abstract: str


class SavePaperRequest(BaseModel):
    title: str
    authors: str
    year: int
    doi: str = ""
    url: str = ""


def _ensure_tables() -> None:
    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_papers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paper_title TEXT NOT NULL,
                paper_authors TEXT NOT NULL,
                paper_year INTEGER NOT NULL,
                paper_doi TEXT,
                paper_url TEXT,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _load_sample_papers(query: str, year_from: int, year_to: int) -> list[dict[str, Any]]:
    if not SAMPLE_PAPERS_PATH.exists():
        return []

    try:
        with open(SAMPLE_PAPERS_PATH, "r", encoding="utf-8") as f:
            sample_data = json.load(f)
    except Exception:
        return []

    papers = []
    for idx, item in enumerate(sample_data.get("items", []), start=1):
        year = item.get("year", 2024)
        if year_from <= year <= year_to:
            if query.lower() in item.get("title", "").lower() or query.lower() in item.get("summary", "").lower():
                source = item.get("source", "Sample")
                papers.append({
                    "id": idx,
                    "title": item.get("title", "Untitled"),
                    "authors": item.get("source", "Unknown"),
                    "year": year,
                    "source": source,
                    "citations": item.get("citations", 0),
                    "doi": item.get("doi", ""),
                    "url": item.get("url", ""),
                    "abstract": item.get("summary", ""),
                })
    return papers


def _search_saved_papers(query: str, year_from: int, year_to: int) -> list[dict[str, Any]]:
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        rows = conn.execute(
            "SELECT id, paper_title, paper_authors, paper_year, paper_doi, paper_url FROM saved_papers "
            "WHERE paper_year BETWEEN ? AND ?"
            , (year_from, year_to)
        ).fetchall()
        results = []
        for row in rows:
            title = row[1] or "Untitled"
            if query.lower() in title.lower():
                results.append({
                    "id": row[0],
                    "title": title,
                    "authors": row[2] or "Unknown",
                    "year": row[3],
                    "source": "Saved Paper",
                    "citations": 0,
                    "doi": row[4] or "",
                    "url": row[5] or "",
                    "abstract": "Saved literature item.",
                })
        return results
    finally:
        conn.close()


@router.post("/search")
def search_literature(payload: LiteratureSearchRequest) -> dict[str, Any]:
    query = payload.query.strip()
    papers: list[dict[str, Any]] = []

    # 1. Local saved papers
    papers.extend(_search_saved_papers(query, payload.year_from, payload.year_to))

    # 2. arXiv search
    if len(papers) < 3:
        arxiv_results = search_arxiv(query, max_results=10)
        for idx, paper in enumerate(arxiv_results, start=len(papers) + 1):
            year = paper.get("year", 2024)
            if not (payload.year_from <= year <= payload.year_to):
                continue
            papers.append({
                "id": idx,
                "title": paper.get("title", "Unknown"),
                "authors": ", ".join(paper.get("authors", [])) if paper.get("authors") else "Unknown",
                "year": year,
                "source": paper.get("source", "arXiv"),
                "citations": paper.get("citations", 0),
                "doi": paper.get("doi", ""),
                "url": paper.get("url", ""),
                "abstract": paper.get("summary", ""),
            })
            if len(papers) >= 3:
                break

    # 3. Fallback sample papers
    if len(papers) < 3:
        sample_papers = _load_sample_papers(query, payload.year_from, payload.year_to)
        for paper in sample_papers:
            if len(papers) >= 5:
                break
            papers.append(paper)

    # 4. Calculate Relevance Score and Index in FAISS
    for paper in papers:
        paper["relevance_score"] = literature_service.calculate_relevance(query, paper["abstract"])
    
    literature_service.index_papers(papers)

    return {"success": True, "total": len(papers), "papers": papers}

@router.post("/summarize")
def summarize_paper(payload: SummarizeRequest) -> dict[str, Any]:
    summary = literature_service.summarize_paper(payload.title, payload.abstract)
    return {"success": True, "summary": summary}


@router.post("/save")
def save_paper(payload: SavePaperRequest) -> dict[str, Any]:
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO saved_papers (paper_title, paper_authors, paper_year, paper_doi, paper_url) VALUES (?, ?, ?, ?, ?)",
            (payload.title, payload.authors, payload.year, payload.doi, payload.url),
        )
        conn.commit()
        return {"success": True, "paper_id": cur.lastrowid}
    finally:
        conn.close()


@router.get("/saved")
def get_saved_papers() -> dict[str, Any]:
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        rows = conn.execute(
            "SELECT id, paper_title, paper_authors, paper_year, paper_doi, paper_url, saved_at FROM saved_papers ORDER BY saved_at DESC"
        ).fetchall()
        papers = [
            {
                "id": row[0],
                "title": row[1],
                "authors": row[2],
                "year": row[3],
                "doi": row[4] or "",
                "url": row[5] or "",
                "saved_at": row[6],
            }
            for row in rows
        ]
        return {"success": True, "papers": papers}
    finally:
        conn.close()


@router.delete("/saved/{paper_id}")
def delete_saved_paper(paper_id: int) -> dict[str, Any]:
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute("DELETE FROM saved_papers WHERE id = ?", (paper_id,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@router.get("/bibliography")
def get_bibliography() -> dict[str, Any]:
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        rows = conn.execute("SELECT paper_title, paper_authors, paper_year FROM saved_papers").fetchall()
        refs = [f"[{idx}] {r[1]}, \"{r[0]},\" {r[2]}." for idx, r in enumerate(rows, start=1)]
        return {"success": True, "bibliography": "\n".join(refs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build bibliography: {e!s}") from e
    finally:
        conn.close()


class LiteratureSurveyRequest(BaseModel):
    query: str
    papers: list[dict[str, Any]]

@router.post("/generate-survey")
def generate_literature_survey_endpoint(payload: LiteratureSurveyRequest) -> dict[str, Any]:
    survey = literature_service.generate_literature_survey(payload.query, payload.papers)
    return {"success": True, "survey": survey}
