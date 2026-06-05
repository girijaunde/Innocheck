from __future__ import annotations

import re
from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import AnalysisResult, ProblemStatement, PrototypeGeneration

STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "idea",
    "using",
    "rural",
}


def _extract_topics(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z]{4,}", text.lower())
    return [token for token in tokens if token not in STOPWORDS]


def build_dashboard(db: Session, user_id: int) -> dict[str, Any]:
    analyses = (
        db.query(ProblemStatement, AnalysisResult)
        .join(AnalysisResult, AnalysisResult.problem_id == ProblemStatement.id)
        .filter(ProblemStatement.user_id == user_id)
        .order_by(ProblemStatement.submitted_at.desc())
        .all()
    )
    prototypes = (
        db.query(PrototypeGeneration)
        .filter(PrototypeGeneration.user_id == user_id)
        .order_by(PrototypeGeneration.created_at.desc())
        .all()
    )

    total_analyses = len(analyses)
    avg_uniqueness = round(
        sum((problem.uniqueness_score or 0) for problem, _ in analyses) / max(1, total_analyses),
        2,
    )

    gap_counts: Counter[str] = Counter()
    topic_counts: Counter[str] = Counter()
    monthly_counts: Counter[str] = Counter()
    recent_items: list[dict[str, Any]] = []

    for problem, analysis in analyses:
        payload = dict(analysis.results_json)
        for gap in payload.get("innovation_gaps", []):
            if gap.get("title"):
                gap_counts.update([gap["title"]])
        topic_counts.update(_extract_topics(problem.text))
        monthly_counts.update([problem.submitted_at.strftime("%Y-%m")])
        recent_items.append(
            {
                "problem_id": problem.id,
                "text": problem.text,
                "submitted_at": problem.submitted_at.isoformat(),
                "uniqueness_score": problem.uniqueness_score,
                "score_label": payload.get("score_label"),
            }
        )

    trend_points = [
        {"month": month, "count": monthly_counts[month]}
        for month in sorted(monthly_counts.keys())
    ]

    return {
        "stats": {
            "total_analyses": total_analyses,
            "average_uniqueness_score": avg_uniqueness,
            "saved_prototypes": len(prototypes),
            "top_uniqueness_score": max([(problem.uniqueness_score or 0) for problem, _ in analyses], default=0),
        },
        "top_gaps": [{"title": title, "count": count} for title, count in gap_counts.most_common(5)],
        "trending_topics": [{"topic": topic, "count": count} for topic, count in topic_counts.most_common(6)],
        "activity_series": trend_points,
        "recent_analyses": recent_items[:8],
    }
