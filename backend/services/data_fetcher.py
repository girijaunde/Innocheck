from __future__ import annotations

from typing import Any

import requests


def fetch_arxiv(query: str, limit: int = 3) -> list[dict[str, Any]]:
    # Lightweight fallback-ready stub for free arXiv endpoint.
    url = "https://export.arxiv.org/api/query"
    params = {"search_query": f"all:{query}", "start": 0, "max_results": limit}
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code != 200:
            return []
        # Keep parsing simple for reliability; API is Atom XML.
        return []
    except Exception:
        return []


def fetch_semantic_scholar(query: str, limit: int = 3) -> list[dict[str, Any]]:
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {"query": query, "limit": limit, "fields": "title,year,venue,url,citationCount"}
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code != 200:
            return []
        data = res.json().get("data", [])
        return [
            {
                "title": p.get("title", "Unknown"),
                "year": p.get("year"),
                "venue": p.get("venue") or "N/A",
                "url": p.get("url") or "",
                "citations": p.get("citationCount", 0),
            }
            for p in data
        ]
    except Exception:
        return []

