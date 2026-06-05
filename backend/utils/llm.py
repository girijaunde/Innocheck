"""Shared LLM client for InnoCheck."""

from __future__ import annotations

import logging
import requests

from backend.core.config import GEMINI_API_KEY, GEMINI_MODEL, GROQ_API_KEY, GROQ_MODEL

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

logger = logging.getLogger(__name__)


def call_groq_internal(prompt: str, model_name: str | None = None) -> str:
    if not GROQ_API_KEY or GROQ_API_KEY == "your_key_here":
        raise ValueError("GROQ_API_KEY is not configured")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model_name or GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
    }
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def call_gemini_internal(prompt: str, model_name: str | None = None) -> str:
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_key_here" or genai is None:
        raise ValueError("GEMINI_API_KEY is not configured or google-generativeai is missing")
    
    genai.configure(api_key=GEMINI_API_KEY)
    m = genai.GenerativeModel(model_name or GEMINI_MODEL)
    response = m.generate_content(prompt)
    return (response.text or "").strip()


def call_llm(prompt: str, model_name: str | None = None) -> str:
    """Call LLM with automatic fallback between Gemini and Groq."""
    errors = []
    
    # Try Gemini first if available
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_key_here":
        try:
            return call_gemini_internal(prompt, model_name)
        except Exception as e:
            logger.warning("Gemini generation failed: %s", e)
            errors.append(f"Gemini: {e}")
            
    # Fallback to Groq
    if GROQ_API_KEY and GROQ_API_KEY != "your_key_here":
        try:
            return call_groq_internal(prompt, model_name)
        except Exception as e:
            logger.warning("Groq generation failed: %s", e)
            errors.append(f"Groq: {e}")

    # If we get here, both failed or neither was configured
    if not errors:
        logger.error("No valid API keys found for Gemini or Groq.")
    else:
        logger.error("All AI providers failed: %s", " | ".join(errors))
        
    return ""

# Alias for backwards compatibility
call_gemini = call_llm
