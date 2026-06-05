from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import faiss
import numpy as np
from sqlalchemy.orm import Session

from backend.database.models import ExternalData
from backend.utils.embeddings import embed_texts


@dataclass
class SearchFilters:
    year_from: int | None = None
    year_to: int | None = None
    min_citations: int | None = None
    source: str | None = None

    def normalized_source(self) -> str:
        return (self.source or "").strip().lower()


def _passes_filters(row: dict[str, Any], filters: SearchFilters | None) -> bool:
    if filters is None:
        return True

    year = row.get("year")
    citations = row.get("citations")
    source = str(row.get("source", "")).strip().lower()

    if filters.year_from is not None and (year is None or int(year) < filters.year_from):
        return False
    if filters.year_to is not None and (year is None or int(year) > filters.year_to):
        return False
    if filters.min_citations is not None and (citations is None or int(citations) < filters.min_citations):
        return False

    wanted_source = filters.normalized_source()
    if wanted_source and source != wanted_source:
        return False
    return True


def _row_to_text(row: dict[str, Any]) -> str:
    return (
        f"{row.get('title', '')}. {row.get('summary', '')}. {row.get('abstract', '')}. "
        f"Domain: {row.get('domain', '')}. Venue: {row.get('source', '')}. "
        f"Tech: {', '.join(row.get('tech_stack', []))}."
    )


class SemanticSearchIndex:
    def __init__(self, items: list[dict[str, Any]]) -> None:
        self.items = [dict(item) for item in items]
        if not self.items:
            self.embeddings = np.zeros((0, 384), dtype=np.float32)
            self.index = None
            return
        texts = [_row_to_text(item) for item in self.items]
        self.embeddings = embed_texts(texts).astype(np.float32)
        self.index = faiss.IndexFlatIP(self.embeddings.shape[1])
        self.index.add(self.embeddings)

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: SearchFilters | None = None,
    ) -> list[dict[str, Any]]:
        if self.index is None or not self.items:
            return []

        query_vector = embed_texts([query]).astype(np.float32)
        limit = min(max(top_k * 3, 10), len(self.items))
        scores, indices = self.index.search(query_vector, limit)

        results: list[dict[str, Any]] = []
        for idx, score in zip(indices[0], scores[0]):
            if int(idx) < 0:
                continue
            row = dict(self.items[int(idx)])
            if not _passes_filters(row, filters):
                continue
            row["semantic_score"] = float(score)
            row["similarity"] = int(max(0.0, min(1.0, float(score))) * 100)
            results.append(row)
            if len(results) >= top_k:
                break
        return results


def load_external_items(db: Session, filters: SearchFilters | None = None, limit: int = 250) -> list[dict[str, Any]]:
    query = db.query(ExternalData).order_by(ExternalData.fetched_at.desc()).limit(limit)
    rows = query.all()
    items: list[dict[str, Any]] = []
    for row in rows:
        item = {
            "title": row.title,
            "summary": row.abstract or "",
            "abstract": row.abstract or "",
            "domain": row.metadata_json.get("domain", "") if isinstance(row.metadata_json, dict) else "",
            "year": row.year,
            "source": row.source,
            "url": row.url or "",
            "citations": row.citations,
            "tech_stack": [],
            "known_gap": "Derived from cached external literature.",
        }
        if _passes_filters(item, filters):
            items.append(item)
    return items
