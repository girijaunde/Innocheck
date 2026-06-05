from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import AnalysisResult, ProblemStatement


def compare_ideas(db: Session, user_id: int, problem_ids: list[int]) -> dict[str, Any]:
    if len(problem_ids) < 2 or len(problem_ids) > 3:
        raise ValueError("Select 2 or 3 ideas to compare.")

    rows = (
        db.query(ProblemStatement, AnalysisResult)
        .join(AnalysisResult, AnalysisResult.problem_id == ProblemStatement.id)
        .filter(ProblemStatement.user_id == user_id, ProblemStatement.id.in_(problem_ids))
        .all()
    )

    if len(rows) != len(set(problem_ids)):
        raise ValueError("Some selected ideas were not found.")

    ideas: list[dict[str, Any]] = []
    for problem, analysis in rows:
        payload = dict(analysis.results_json)
        ideas.append(
            {
                "problem_id": problem.id,
                "text": problem.text,
                "uniqueness_score": payload.get("uniqueness_score"),
                "score_label": payload.get("score_label"),
                "primary_gap": next(
                    (gap.get("title") for gap in payload.get("innovation_gaps", []) if gap.get("is_primary")),
                    None,
                ),
                "suggestion_title": (payload.get("unique_suggestion") or {}).get("title"),
                "top_similar_titles": [p.get("title") for p in payload.get("similar_papers", [])[:3]],
                "dimensions": payload.get("dimensions", {}),
            }
        )

    gap_counts = Counter([idea.get("primary_gap") for idea in ideas if idea.get("primary_gap")])
    best = max(ideas, key=lambda idea: idea.get("uniqueness_score") or 0)
    avg_score = round(sum((idea.get("uniqueness_score") or 0) for idea in ideas) / len(ideas), 2)

    return {
        "items": sorted(ideas, key=lambda idea: problem_ids.index(idea["problem_id"])),
        "summary": {
            "best_problem_id": best["problem_id"],
            "best_uniqueness_score": best.get("uniqueness_score"),
            "average_uniqueness_score": avg_score,
            "most_common_primary_gap": gap_counts.most_common(1)[0][0] if gap_counts else None,
        },
    }
