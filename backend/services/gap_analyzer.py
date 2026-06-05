from __future__ import annotations

from collections import Counter
from typing import Any


def _extract_common_patterns(similar_items: list[dict[str, Any]]) -> dict[str, str]:
    domains = Counter([x.get("domain", "General") for x in similar_items])
    tech = Counter()
    for item in similar_items:
        tech.update(item.get("tech_stack", []))
    return {
        "dominant_domain": domains.most_common(1)[0][0] if domains else "General",
        "common_tech": ", ".join([t for t, _ in tech.most_common(5)]) if tech else "N/A",
    }


def identify_gaps(problem: str, similar_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    patterns = _extract_common_patterns(similar_items)
    text = problem.lower()

    gaps = [
        {
            "title": "Dataset Limitation",
            "existing": "Most existing solutions rely on narrow or lab-controlled datasets.",
            "opportunity": "Collect real-world Indian context data and include edge-case samples.",
            "is_primary": False,
        },
        {
            "title": "Language Accessibility",
            "existing": "Many solutions are English-first and miss local language adoption.",
            "opportunity": "Add multilingual support (Marathi/Hindi) with simple voice-first flows.",
            "is_primary": False,
        },
        {
            "title": "Deployment Resilience",
            "existing": "Several projects assume stable internet and cloud-only inference.",
            "opportunity": "Offer offline or low-bandwidth modes with lightweight on-device inference.",
            "is_primary": False,
        },
    ]

    if "offline" in text or "rural" in text:
        primary = "Deployment Resilience"
    elif "marathi" in text or "hindi" in text or "language" in text:
        primary = "Language Accessibility"
    else:
        primary = "Dataset Limitation"

    for g in gaps:
        g["existing"] = f"{g['existing']} Common domain: {patterns['dominant_domain']}."
        g["is_primary"] = g["title"] == primary

    return gaps

