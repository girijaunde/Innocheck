from __future__ import annotations

from typing import Any

from backend.services.gap_analyzer import identify_gaps
from backend.utils.llm import call_gemini
from backend.utils.prompts import innovation_prompt, literature_prompt


def _call_gemini(prompt: str) -> str:
    return call_gemini(prompt)


def run_multi_agent_pipeline(problem: str, similar_items: list[dict[str, Any]]) -> dict[str, Any]:
    # Retriever agent output is `similar_items` from HybridSearchEngine.
    gaps = identify_gaps(problem, similar_items)

    patterns = "\n".join(
        [f"- {item.get('title', '')}: {item.get('summary', '')}" for item in similar_items[:5]]
    )
    gap_text = "\n".join([f"- {g['title']}: {g['opportunity']}" for g in gaps])

    synth_prompt = innovation_prompt(problem, patterns, gap_text)
    generated_suggestion = _call_gemini(synth_prompt)
    if not generated_suggestion:
        generated_suggestion = (
            "Title: Regional Offline Innovation Layer\n"
            "Description: Build a multilingual and offline-first variant that targets low-connectivity users, "
            "includes local datasets, and integrates lightweight on-device ML for better adoption.\n"
            "Tags: Offline ML, Regional AI, Edge Deployment"
        )

    lit_prompt = literature_prompt(problem, [x.get("title", "") for x in similar_items[:5]])
    literature = _call_gemini(lit_prompt)
    if not literature:
        literature = (
            "Recent work in this problem area shows strong adoption of deep learning pipelines, but most solutions "
            "focus on benchmark-heavy settings with limited deployment diversity. Prior approaches report high "
            "accuracy, yet often depend on constrained datasets and cloud inference assumptions.\n\n"
            "Across implementations, recurring gaps include limited multilingual UX, weak support for rural or "
            "low-connectivity settings, and insufficient consideration for region-specific variation. Many projects "
            "optimize model performance but under-specify operational constraints such as latency, device class, and "
            "data drift handling.\n\n"
            "This motivates a contribution centered on practical innovation: multilingual workflows, localized data "
            "collection strategy, and offline-capable edge deployment. A system designed around these constraints can "
            "improve both novelty and real-world adoption while remaining feasible for student teams."
        )

    return {
        "innovation_gaps": gaps,
        "unique_suggestion_raw": generated_suggestion,
        "literature_review": literature,
    }

