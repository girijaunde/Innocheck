"""Build validation / analysis payloads (modes, scoring) using an Agentic Tool-Calling approach."""

from __future__ import annotations

import json
import logging
from typing import Any, Literal
import openai

from sqlalchemy.orm import Session

from backend.services.arxiv_service import search_arxiv
from backend.services.github_service import github_service
from backend.services.gap_analyzer import identify_gaps
from backend.services.openai_service import openai_service
from backend.services.project_service import project_service
from backend.services.rag_engine import run_multi_agent_pipeline
from backend.core.config import AVAILABLE_AI_PROVIDERS

logger = logging.getLogger(__name__)

Mode = Literal["full", "uniqueness", "gaps", "similar", "suggestion", "literature"]

def _score_label(score: int) -> tuple[str, str]:
    if score >= 81:
        return "Highly Unique", "Strong novelty with limited overlap found."
    if score >= 61:
        return "Moderately Unique", "Your idea has potential but some similar work exists."
    if score >= 41:
        return "Needs Innovation", "Overlap exists; differentiate using gaps and regional angles."
    return "Common", "The idea overlaps heavily; consider a narrower or novel direction."

def _dimension_scores(uniqueness: int, avg_similarity: int) -> dict[str, int]:
    novelty = max(35, min(95, uniqueness + 8))
    feasibility = max(40, min(95, 88 - (100 - uniqueness) // 4))
    impact = max(45, min(95, uniqueness + 15))
    market_gap = max(30, min(95, 100 - avg_similarity))
    return {
        "novelty": int(novelty),
        "feasibility": int(feasibility),
        "impact": int(impact),
        "market_gap": int(market_gap),
    }

def _default_tech_stack() -> list[dict[str, Any]]:
    return [
        {"category": "Frontend", "items": ["React", "Tailwind CSS"]},
        {"category": "ML Framework", "items": ["PyTorch", "TensorFlow Lite"]},
        {"category": "Backend", "items": ["FastAPI", "PostgreSQL"]},
        {"category": "Deployment", "items": ["Docker", "Nginx"]},
        {"category": "Mobile", "items": ["Flutter", "Firebase"]},
    ]

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_github",
            "description": "Search GitHub for repositories related to the given query. Useful for finding technical overlaps and open source projects.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query (e.g. keywords for the project idea)"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_arxiv",
            "description": "Search arXiv for academic papers related to the given query. Useful for finding research gaps and literature.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query (e.g. keywords for the research idea)"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

def _run_agentic_analysis(query: str, suggestions: str = "") -> dict:
    """Run an agentic loop allowing the LLM to call tools to gather evidence, then return JSON analysis."""
    if not AVAILABLE_AI_PROVIDERS:
        logger.warning("No AI providers available for agentic analysis.")
        return {}
        
    messages = [
        {
            "role": "system", 
            "content": (
                "You are an expert innovation analyst and hackathon judge. "
                "First, use the search_github and search_arxiv tools to gather real evidence "
                "about existing solutions, technical overlaps, and research gaps. "
                "Once you have gathered enough evidence, generate a comprehensive Idea Validation report. "
                "Your final response MUST be a valid JSON object with the following keys:\n"
                "- uniqueness_score (0-100)\n"
                "- score_label (Highly Unique|Moderately Unique|Needs Innovation|Common)\n"
                "- score_description (string)\n"
                "- dimensions (object with novelty, feasibility, impact, market_gap from 0-100)\n"
                "- innovation_gaps (list of objects with title, existing, opportunity, is_primary)\n"
                "- improvement_suggestions (list of 3 specific architectures/approaches)\n"
                "- potential_challenges (list of strings)\n"
                "- success_metrics (list of strings)\n"
                "- tech_stack (list of objects with category and items array)\n"
                "Do NOT include markdown formatting around your final JSON, just return the JSON object."
            )
        },
        {
            "role": "user",
            "content": f"IDEA: {query}\n\nSUGGESTIONS: {suggestions}"
        }
    ]
    
    for provider in AVAILABLE_AI_PROVIDERS:
        try:
            client = openai.OpenAI(api_key=provider["api_key"], base_url=provider.get("base_url"))
            model = provider["model"]
            
            logger.debug(f"Agentic analysis starting with provider: {provider['name']}")
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=AGENT_TOOLS,
                tool_choice="auto",
                temperature=0.7
            )
            
            response_message = response.choices[0].message
            
            if response_message.tool_calls:
                messages.append(response_message)
                
                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name
                    try:
                        args = json.loads(tool_call.function.arguments)
                    except json.JSONDecodeError:
                        args = {}
                        
                    if function_name == "search_github":
                        q = args.get("query", query)
                        res = github_service.search_repositories(q, max_results=3)
                        messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(res)})
                    elif function_name == "search_arxiv":
                        q = args.get("query", query)
                        res = search_arxiv(q)
                        messages.append({"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(res[:3])})
                        
                final_response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7
                )
                final_text = final_response.choices[0].message.content
            else:
                final_text = response_message.content
                
            if final_text:
                start_idx = final_text.find('{')
                end_idx = final_text.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = final_text[start_idx:end_idx]
                    return json.loads(json_str)
                    
            return {}
        except Exception as e:
            logger.warning(f"Agentic loop failed for provider {provider['name']}: {e}")
            continue
            
    return {}

def build_analysis(
    query: str,
    db: Session,
    mode: Mode = "full",
    suggestions: str = "",
) -> dict[str, Any]:
    search_keywords = openai_service.extract_keywords(query)
    if not search_keywords:
        search_keywords = [word for word in query.lower().split() if len(word) > 3][:6]

    # Search local database first
    similar = project_service.search_projects(db, query, top_k=5, keywords=search_keywords)
    if len(similar) < 3:
        project_service.fetch_real_world_data(db, query, keywords=search_keywords, force_refresh=True)
        similar = project_service.search_projects(db, query, top_k=5, keywords=search_keywords)

    def format_similar(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "title": item.get("title", "Unknown"),
                "summary": item.get("summary", ""),
                "year": item.get("year", 2024),
                "venue": item.get("source", "Hackathon/Repository"),
                "source": item.get("source", "Hackathon/Repository"),
                "similarity": item.get("similarity", 0),
                "gap": item.get("known_gap", "Limited localization and deployment depth."),
                "url": item.get("url", ""),
            }
            for item in items
        ]

    similar_papers = format_similar(similar)
    base_result = {
        "similar_papers": similar_papers,
        "search_keywords": search_keywords,
    }

    if mode in ("full", "suggestion"):
        try:
            # Use Tool-Calling Agent instead of default analysis
            ai_analysis = _run_agentic_analysis(query, suggestions)
            
            # Fallback to standard OpenAI service if agent fails
            if not ai_analysis or "uniqueness_score" not in ai_analysis:
                logger.info("Agentic analysis returned empty/invalid format, falling back to standard analysis")
                ai_analysis = openai_service.analyze_idea(query, similar, suggestions=suggestions)
                
            result = {
                "uniqueness_score": ai_analysis.get("uniqueness_score", 65),
                "score_label": ai_analysis.get("score_label", "Moderately Unique"),
                "score_description": ai_analysis.get("score_description", "Agentic AI-powered analysis completed"),
                "dimensions": ai_analysis.get("dimensions", _dimension_scores(65, 50)),
                "innovation_gaps": ai_analysis.get("innovation_gaps", identify_gaps(query, similar)),
                "unique_suggestion": ai_analysis.get("unique_suggestion", {
                    "title": "AI-Enhanced Solution",
                    "description": "AI-powered project suggestion",
                    "tags": ["AI", "Innovation", "Hackathon"]
                }),
                "tech_stack": ai_analysis.get("tech_stack", _default_tech_stack()),
                "improvement_suggestions": ai_analysis.get("improvement_suggestions", []),
                "potential_challenges": ai_analysis.get("potential_challenges", []),
                "success_metrics": ai_analysis.get("success_metrics", []),
                "ai_enhanced": True,
                **base_result,
            }

            if mode == "full":
                rag_output = run_multi_agent_pipeline(query, similar)
                result["literature_review"] = rag_output.get("literature_review", "")

            return result

        except Exception as e:
            logger.error(f"AI analysis failed, falling back to traditional analysis: {e}")

    avg_similarity = int(sum(x.get("similarity", 0) for x in similar) / max(1, len(similar)))
    uniqueness = int(max(0, min(100, round(100 - (avg_similarity * 0.8)))))
    label, description = _score_label(uniqueness)
    dims = _dimension_scores(uniqueness, avg_similarity)

    base: dict[str, Any] = {
        "uniqueness_score": uniqueness,
        "score_label": label,
        "score_description": description,
        "dimensions": dims,
        "ai_enhanced": False,
        **base_result,
    }

    if mode == "uniqueness":
        return base

    gaps = identify_gaps(query, similar)
    if mode == "gaps":
        return {**base, "innovation_gaps": gaps}

    if mode == "similar":
        return {**base, "similar_papers": similar_papers}

    need_rag = mode in ("full", "suggestion", "literature")
    rag_output: dict[str, Any] = {}
    if need_rag:
        rag_output = run_multi_agent_pipeline(query, similar)

    if mode == "suggestion":
        suggestion_text = rag_output.get("unique_suggestion_raw", "")
        sug_lines = [line.strip() for line in suggestion_text.splitlines() if line.strip()]
        title = "Innovation Suggestion"
        desc = suggestion_text
        tags = ["Innovation", "Hackathon", "Applied AI"]
        for line in sug_lines:
            if line.lower().startswith("title:"):
                title = line.split(":", 1)[1].strip()
            elif line.lower().startswith("description:"):
                desc = line.split(":", 1)[1].strip()
            elif line.lower().startswith("tags:"):
                tags = [t.strip() for t in line.split(":", 1)[1].split(",") if t.strip()]
        return {
            **base,
            "innovation_gaps": gaps,
            "similar_papers": similar_papers,
            "unique_suggestion": {"title": title, "description": desc, "tags": tags[:5]},
            "tech_stack": _default_tech_stack(),
        }

    if mode == "literature":
        return {
            **base,
            "similar_papers": similar_papers,
            "literature_review": rag_output.get("literature_review", ""),
        }

    suggestion_text = rag_output.get("unique_suggestion_raw", "")
    sug_lines = [line.strip() for line in suggestion_text.splitlines() if line.strip()]
    title = "Innovation Suggestion"
    desc = suggestion_text
    tags = ["Innovation", "Hackathon", "Applied AI"]
    for line in sug_lines:
        if line.lower().startswith("title:"):
            title = line.split(":", 1)[1].strip()
        elif line.lower().startswith("description:"):
            desc = line.split(":", 1)[1].strip()
        elif line.lower().startswith("tags:"):
            tags = [t.strip() for t in line.split(":", 1)[1].split(",") if t.strip()]

    return {
        **base,
        "similar_papers": similar_papers,
        "innovation_gaps": rag_output.get("innovation_gaps", gaps),
        "unique_suggestion": {"title": title, "description": desc, "tags": tags[:5]},
        "tech_stack": _default_tech_stack(),
        "literature_review": rag_output.get("literature_review", ""),
    }
