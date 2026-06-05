"""Service for AI-powered idea analysis using OpenAI API."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import openai

from backend.core.config import AVAILABLE_AI_PROVIDERS

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for AI-powered idea analysis and improvement suggestions."""
    
    def __init__(self):
        """Initialize AI providers from configuration."""
        self.providers = AVAILABLE_AI_PROVIDERS
        
        if not self.providers:
            logger.warning("⚠️  No AI providers configured - falling back to defaults")
            return
            
        provider_names = [p['name'].upper() for p in self.providers]
        logger.info(f"OpenAIService initialized with providers: {', '.join(provider_names)}")

    def _create_completion(self, messages: list, temperature: float, max_tokens: int) -> str | None:
        """Create a completion with automatic failover across available providers."""
        if not self.providers:
            return None
            
        for provider in self.providers:
            try:
                client = openai.OpenAI(
                    api_key=provider["api_key"],
                    base_url=provider.get("base_url")
                )
                logger.debug(f"Calling provider: {provider['name']} (model: {provider['model']})")
                response = client.chat.completions.create(
                    model=provider["model"],
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning(f"Provider {provider['name']} failed: {e}. Trying next provider...")
                
        logger.error("All AI providers failed.")
        return None
    
    def analyze_idea(self, idea: str, similar_projects: List[Dict[str, Any]] | None = None, suggestions: str = "") -> Dict[str, Any]:
        """
        Analyze an idea using OpenAI and return comprehensive insights.
        
        Args:
            idea: The problem statement or project idea
            similar_projects: List of similar projects for context
            suggestions: User's technical suggestions (optional)
            
        Returns:
            Dictionary containing analysis results
        """
        if similar_projects is None:
            similar_projects = []
            
        if not self.providers:
            logger.info("No AI providers available, using fallback analysis")
            return self._fallback_analysis(idea, similar_projects)
        
        try:
            context = self._prepare_context(similar_projects)
            prompt = self._create_analysis_prompt(idea, context, suggestions)
            
            logger.debug(f"Calling AI API for idea: {idea[:50]}...")
            analysis_text = self._create_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert innovation analyst and hackathon judge. Provide detailed, actionable insights about project ideas in valid JSON format."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            if not analysis_text:
                return self._fallback_analysis(idea, similar_projects)
                
            result = self._parse_analysis_response(analysis_text)
            logger.info(f"✓ AI analysis completed for idea: {idea[:30]}...")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            return self._fallback_analysis(idea, similar_projects)
    
    def extract_keywords(self, text: str) -> list[str]:
        """Extract 4-6 keywords from user input using OpenAI."""
        if not text or not text.strip():
            return []

        if not self.providers:
            logger.info("No AI providers available, using fallback keyword extraction")
            return self._fallback_extract_keywords(text)

        try:
            prompt = (
                "Extract the 4 to 6 most important keywords or short phrases from the user input. "
                "Return JSON only in this exact format: {\"keywords\": [\"keyword1\", \"keyword2\", ...]}. "
                "Do not include any extra text."
                f"\n\nUser Input:\n{text}"
            )
            result_text = self._create_completion(
                messages=[
                    {"role": "system", "content": "You are a precise keyword extraction assistant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=150,
            )

            if not result_text:
                return self._fallback_extract_keywords(text)
                
            keywords = self._parse_keyword_response(result_text)
            if not keywords:
                return self._fallback_extract_keywords(text)
            return keywords[:6]

        except Exception as e:
            logger.error(f"Keyword extraction failed: {e}", exc_info=True)
            return self._fallback_extract_keywords(text)

    def _parse_keyword_response(self, response_text: str) -> list[str]:
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON found in keyword extraction response")
                return []

            json_str = response_text[start_idx:end_idx]
            parsed = json.loads(json_str)
            keywords = parsed.get("keywords", [])
            if isinstance(keywords, list):
                return [str(k).strip() for k in keywords if str(k).strip()][:6]
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Keyword JSON parse failed: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected keyword parsing error: {e}")
            return []

    def _fallback_extract_keywords(self, text: str) -> list[str]:
        """Fallback keyword extraction when OpenAI is unavailable."""
        stopwords = {
            'the', 'and', 'with', 'that', 'this', 'from', 'about', 'using', 'their',
            'while', 'after', 'before', 'between', 'during', 'where', 'when', 'which',
            'these', 'those', 'your', 'yourself', 'into', 'within', 'for', 'have',
            'could', 'would', 'should', 'there', 'here', 'what', 'how', 'why', 'who',
            'also', 'such', 'than', 'because', 'other', 'some', 'many', 'most', 'only',
            'make', 'will', 'can', 'may', 'project', 'solution', 'system', 'data'
        }
        words = [w.strip('.,!?()[]"\'').lower() for w in text.split() if w.strip('.,!?()[]"\'')]
        candidates = [w for w in words if w.isalpha() and len(w) > 3 and w not in stopwords]
        unique = []
        for word in candidates:
            if word not in unique:
                unique.append(word)
            if len(unique) >= 6:
                break
        return unique[:6]

    def analyze_plagiarism(self, text: str, sources: list[str] | None = None) -> Dict[str, Any]:
        """Analyze plagiarism risk and return a report based on user text."""
        if sources is None or "all" in sources:
            sources = ["devpost", "github", "arxiv"]

        if not self.providers:
            logger.info("No AI providers available, using fallback plagiarism analysis")
            return self._fallback_plagiarism_analysis(text, sources)

        try:
            prompt = self._create_plagiarism_prompt(text, sources)
            logger.debug("Calling AI API for plagiarism analysis...")
            analysis_text = self._create_completion(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert plagiarism analyst. Review the provided text and assess "
                            "whether it appears to be copied, overly formulaic, or likely matched to common public sources. "
                            "Use the specified source categories as context, but do not invent exact matches if they cannot be justified. "
                            "Return only valid JSON with no surrounding markdown."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=1200
            )

            if not analysis_text:
                return self._fallback_plagiarism_analysis(text, sources)
                
            result = self._parse_plagiarism_response(analysis_text, text)
            logger.info("✓ AI plagiarism analysis completed")
            return result
        except Exception as e:
            logger.error(f"OpenAI plagiarism analysis error: {e}", exc_info=True)
            return self._fallback_plagiarism_analysis(text, sources)

    def _create_plagiarism_prompt(self, text: str, sources: list[str]) -> str:
        """Build a targeted plagiarism analysis prompt for the OpenAI model."""
        sources_text = ", ".join(sources)
        return f"""
Assess plagiarism risk for the following text.

Sources to consider: {sources_text}

Text:
{text}

Respond with valid JSON only, in this exact format:
{{
  "plagiarism_percentage": <number 0-100>,
  "summary": "<one-paragraph summary of plagiarism risk and originality>",
  "detected_issues": ["<issue 1>", "<issue 2>", ...],
  "status": "<low|moderate|high|critical>",
  "status_text": "<one-line status description>",
  "matched_sources": [
    {{
      "source": "<source name>",
      "title": "<short description>",
      "similarity": <number 0-100>,
      "url": "<source URL or empty string>",
      "matched_text": "<excerpt of text that looks copied>"
    }}
  ],
  "highlighted_text": "<final text that was evaluated>"
}}

If you cannot identify a specific matching source, use an empty list for matched_sources. Do not output anything outside the JSON object."""

    def _parse_plagiarism_response(self, response_text: str, original_text: str) -> Dict[str, Any]:
        """Parse the OpenAI response to plagiarism analysis."""
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON object found in plagiarism response")
                return self._fallback_plagiarism_analysis(original_text, [])

            json_str = response_text[start_idx:end_idx]
            analysis = json.loads(json_str)

            if "plagiarism_percentage" not in analysis:
                logger.warning("Plagiarism response missing plagiarism_percentage")
                return self._fallback_plagiarism_analysis(original_text, [])

            analysis["plagiarism_percentage"] = float(analysis.get("plagiarism_percentage", 0.0))
            analysis.setdefault("summary", "No summary provided.")
            analysis.setdefault("detected_issues", [])
            analysis.setdefault("matched_sources", [])
            analysis.setdefault("highlighted_text", original_text)

            if "status" not in analysis or "status_text" not in analysis:
                status, status_text = self._derive_plagiarism_status(analysis["plagiarism_percentage"])
                analysis["status"] = analysis.get("status", status)
                analysis["status_text"] = analysis.get("status_text", status_text)

            return analysis
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for plagiarism response: {e}")
            return self._fallback_plagiarism_analysis(original_text, [])
        except Exception as e:
            logger.error(f"Unexpected error parsing plagiarism response: {e}", exc_info=True)
            return self._fallback_plagiarism_analysis(original_text, [])

    def _derive_plagiarism_status(self, score: float) -> tuple[str, str]:
        if score < 10:
            return "low", "Low Risk - Original Content"
        if score < 25:
            return "moderate", "Moderate Risk - Some Similarity"
        if score < 50:
            return "high", "High Risk - Significant Similarity"
        return "critical", "Critical - High Plagiarism Detected"

    def _fallback_plagiarism_analysis(self, text: str, sources: list[str]) -> Dict[str, Any]:
        tokens = [token.lower() for token in text.split() if token.strip()]
        token_count = len(tokens)
        unique_tokens = len(set(tokens))
        repeat_ratio = 1.0 - (unique_tokens / token_count) if token_count else 0.0

        score = min(100, max(5, int(20 + repeat_ratio * 80)))
        score = float(round(score, 1))

        issues = []
        if repeat_ratio > 0.35:
            issues.append("High phrase repetition suggests formulaic or copied content.")
        if token_count < 100:
            issues.append("Short text limits plagiarism detection confidence.")
        if any(phrase in text.lower() for phrase in ["in this project", "this project aims", "our solution", "the goal is"]):
            issues.append("Generic project wording may indicate reused or template-based language.")

        if not issues:
            issues.append("No obvious repeated patterns found, but review with a dedicated plagiarism database for exact matching.")

        status, status_text = self._derive_plagiarism_status(score)

        return {
            "plagiarism_percentage": score,
            "summary": (
                "This text was analyzed for likely plagiarism risk using heuristic signals such as repetition, "
                "common template phrases, and text structure. Review the identified issues for areas that may be less original."
            ),
            "detected_issues": issues,
            "status": status,
            "status_text": status_text,
            "matched_sources": [],
            "highlighted_text": text
        }

    def _prepare_context(self, similar_projects: List[Dict[str, Any]]) -> str:
        """Prepare context from similar projects for the AI analysis."""
        if not similar_projects:
            return "No similar projects found in the database."
        
        context = "Similar Projects Found:\n"
        for i, project in enumerate(similar_projects[:5], 1):
            context += f"\n{i}. {project.get('title', 'Unknown')}\n"
            context += f"   Domain: {project.get('domain', 'Unknown')}\n"
            context += f"   Summary: {project.get('summary', 'No summary')[:150]}...\n"
        
        return context
    
    def _create_analysis_prompt(self, idea: str, context: str, suggestions: str = "") -> str:
        """Create a comprehensive prompt for idea analysis."""
        suggestions_section = ""
        if suggestions:
            suggestions_section = f"""
USER'S SUGGESTIONS:
{suggestions}

Important: Consider the user's suggestions when evaluating uniqueness and technical approach. Prioritize their specific technical preferences in the 'Uniqueness Score'."""
        
        return f"""
Analyze this hackathon/project idea and provide detailed, actionable insights.

IDEA: {idea}

CONTEXT:
{context}
{suggestions_section}

CRITICAL REQUIREMENT: In your "improvement_suggestions", provide 3 DISTINCT and VARIED technical architectures/approaches. Do NOT give generic advice. Each suggestion must represent a fundamentally different architectural approach (e.g., one using Edge IoT, one using Cloud-based ML, one using Lightweight Mobile processing). Make each architecture specific, concrete, and implementable.

Respond with ONLY valid JSON (no markdown, no extra text) in this exact format:
{{
    "uniqueness_score": <number 0-100>,
    "score_label": "<Highly Unique|Moderately Unique|Needs Innovation|Common>",
    "score_description": "<2-3 sentence description>",
    "dimensions": {{
        "novelty": <number 0-100>,
        "feasibility": <number 0-100>,
        "impact": <number 0-100>,
        "market_gap": <number 0-100>
    }},
    "innovation_gaps": [
        {{
            "title": "<gap title>",
            "existing": "<what exists today>",
            "opportunity": "<improvement opportunity>",
            "is_primary": true
        }},
        {{
            "title": "<another gap>",
            "existing": "<what exists>",
            "opportunity": "<opportunity>",
            "is_primary": false
        }}
    ],
    "improvement_suggestions": [
        "<SPECIFIC ARCHITECTURE 1: Name and concrete technical approach with technologies>",
        "<SPECIFIC ARCHITECTURE 2: Name and concrete technical approach with different technologies>",
        "<SPECIFIC ARCHITECTURE 3: Name and concrete technical approach with third set of technologies>"
    ],
    "potential_challenges": [
        "<challenge 1>",
        "<challenge 2>"
    ],
    "success_metrics": [
        "<metric 1>",
        "<metric 2>"
    ],
    "tech_stack": [
        {{"category": "Frontend", "items": ["tech1", "tech2"]}},
        {{"category": "Backend", "items": ["tech1", "tech2"]}}
    ]
}}
"""
    
    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the OpenAI response into structured data."""
        try:
            # Try to extract and parse JSON
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON found in response, using fallback")
                return self._default_analysis()
            
            json_str = response_text[start_idx:end_idx]
            analysis = json.loads(json_str)
            
            # Validate required fields
            required_fields = ["uniqueness_score", "score_label", "dimensions", "innovation_gaps"]
            if not all(field in analysis for field in required_fields):
                logger.warning("Missing required fields in response")
                return self._enrich_response(analysis)
            
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}. Response: {response_text[:200]}")
            return self._default_analysis()
    
    def _enrich_response(self, partial: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich partial response with defaults."""
        defaults = self._default_analysis()
        return {**defaults, **partial}
    
    def _default_analysis(self) -> Dict[str, Any]:
        """Return a default analysis structure."""
        return {
            "uniqueness_score": 65,
            "score_label": "Moderately Unique",
            "score_description": "Analysis completed. Your idea has moderate novelty with some similar solutions existing.",
            "dimensions": {
                "novelty": 70,
                "feasibility": 75,
                "impact": 65,
                "market_gap": 60
            },
            "innovation_gaps": [
                {
                    "title": "Feature Enhancement",
                    "existing": "Basic solutions exist with standard features",
                    "opportunity": "Add unique differentiating features",
                    "is_primary": True
                },
                {
                    "title": "User Experience",
                    "existing": "Most solutions lack polished UX",
                    "opportunity": "Focus on superior user experience",
                    "is_primary": False
                }
            ],
            "improvement_suggestions": [
                "Identify your unique value proposition",
                "Research and differentiate from competitors",
                "Focus on user experience and design"
            ],
            "potential_challenges": [
                "Market competition",
                "Technical implementation complexity"
            ],
            "success_metrics": [
                "User engagement and retention",
                "Technical innovation level",
                "Team presentation quality"
            ],
            "tech_stack": [
                {"category": "Frontend", "items": ["React", "Tailwind CSS"]},
                {"category": "Backend", "items": ["FastAPI", "PostgreSQL"]},
                {"category": "Deployment", "items": ["Docker", "Nginx"]}
            ]
        }
    
    def _fallback_analysis(self, idea: str, similar_projects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback analysis when OpenAI is not available."""
        analysis = self._default_analysis()
        analysis["score_description"] = "Analysis based on similar projects. Enable OpenAI API for enhanced insights."
        
        if similar_projects:
            analysis["innovation_gaps"][0]["opportunity"] = f"Based on your idea: {idea[:50]}..."
        
        return analysis
    
    def _parse_text_response(self, response_text: str) -> Dict[str, Any]:
        """Parse text response when JSON parsing fails."""
        # Extract key information from text response
        lines = response_text.split('\n')
        
        # Default structure
        analysis = {
            "uniqueness_score": 65,
            "score_label": "Moderately Unique",
            "score_description": "AI analysis completed successfully.",
            "dimensions": {
                "novelty": 70,
                "feasibility": 75,
                "impact": 65,
                "market_gap": 60
            },
            "innovation_gaps": [
                {
                    "title": "Technical Implementation",
                    "existing": "Similar solutions exist with basic functionality",
                    "opportunity": "Focus on unique features and user experience",
                    "is_primary": True
                }
            ],
            "similar_projects": [],
            "unique_suggestion": {
                "title": "AI-Enhanced Solution",
                "description": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                "tags": ["AI", "Innovation", "Hackathon"]
            },
            "tech_stack": [
                {"category": "Frontend", "items": ["React", "Tailwind CSS"]},
                {"category": "Backend", "items": ["FastAPI", "PostgreSQL"]},
                {"category": "ML Framework", "items": ["PyTorch", "TensorFlow"]}
            ],
            "improvement_suggestions": [
                "Focus on unique value proposition",
                "Consider user experience design",
                "Plan for scalability"
            ],
            "potential_challenges": [
                "Technical complexity",
                "Time constraints for hackathon"
            ],
            "success_metrics": [
                "User engagement",
                "Technical innovation",
                "Presentation quality"
            ]
        }
        
        return analysis


# Create a singleton instance
openai_service = OpenAIService()
