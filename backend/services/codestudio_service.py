"""CodeStudio: Unified code generation, prototyping, and refinement service."""

from __future__ import annotations

import base64
import difflib
import io
import json
import logging
import re
import zipfile
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from backend.database.models import CodeStudioMessage, CodeStudioSession, StudentProject
from backend.services.openai_service import openai_service
from backend.utils.llm import call_gemini

logger = logging.getLogger(__name__)


class CodeStudioService:
    """AI-powered code generation and refinement for components and prototypes."""

    def __init__(self):
        self.gemini_available = bool(call_gemini("test"))
        self.openai_available = bool(openai_service.providers)

    async def generate_component(
        self,
        description: str,
        framework: str,
        typescript: bool = False,
    ) -> dict[str, Any]:
        """
        Generate framework-specific component code.
        
        Args:
            description: User's description of what component to create
            framework: Target framework (react, vue, flask, fastapi, html)
            typescript: Whether to use TypeScript (for React/Vue)
        
        Returns:
            {code, explanation, language, framework}
        """
        framework = framework.lower().strip()
        if framework not in ("react", "vue", "flask", "fastapi", "html"):
            framework = "react"

        prompt = self._build_component_prompt(description, framework, typescript)
        
        try:
            if self.gemini_available:
                raw = call_gemini(prompt)
            elif self.openai_available:
                raw = await self._call_openai(prompt)
            else:
                return self._fallback_component(description, framework, typescript)
            
            code = self._extract_code_block(raw)
            explanation = self._generate_explanation(code, framework)
            
            return {
                "success": True,
                "code": code,
                "explanation": explanation,
                "language": "typescript" if typescript else "javascript" if framework in ("react", "vue") else "python",
                "framework": framework,
            }
        except Exception as e:
            logger.error(f"Component generation failed: {e}")
            return self._fallback_component(description, framework, typescript)

    async def generate_prototype(
        self,
        description: str,
        template_type: str,
        color_scheme: str,
    ) -> dict[str, Any]:
        """
        Generate a complete, interactive HTML prototype.
        
        Args:
            description: What the user wants to build
            template_type: landing_page, dashboard, form, ecommerce, blank
            color_scheme: light, dark, brand
        
        Returns:
            {html, explanation, template_type, color_scheme}
        """
        prompt = self._build_prototype_prompt(description, template_type, color_scheme)
        
        try:
            if self.gemini_available:
                raw = call_gemini(prompt)
            elif self.openai_available:
                raw = await self._call_openai(prompt)
            else:
                return self._fallback_prototype(description, template_type, color_scheme)
            
            html = self._extract_html_block(raw)
            
            return {
                "success": True,
                "html": html,
                "template_type": template_type,
                "color_scheme": color_scheme,
            }
        except Exception as e:
            logger.error(f"Prototype generation failed: {e}")
            return self._fallback_prototype(description, template_type, color_scheme)

    async def refine_code(
        self,
        existing_code: str,
        instruction: str,
        framework: str,
        code_type: str = "component",
    ) -> dict[str, Any]:
        """
        Refine existing code based on user instruction.
        
        Args:
            existing_code: Current code to modify
            instruction: What to change
            framework: Target framework
            code_type: 'component' or 'prototype'
        
        Returns:
            {code, explanation}
        """
        prompt = self._build_refine_prompt(existing_code, instruction, framework, code_type)
        
        try:
            if self.gemini_available:
                raw = call_gemini(prompt)
            elif self.openai_available:
                raw = await self._call_openai(prompt)
            else:
                return {"success": False, "code": existing_code, "explanation": "AI unavailable"}
            
            updated_code = self._extract_code_block(raw)
            
            return {
                "success": True,
                "code": updated_code,
                "explanation": f"Updated {framework} code to: {instruction}",
            }
        except Exception as e:
            logger.error(f"Code refinement failed: {e}")
            return {"success": False, "code": existing_code, "explanation": str(e)}

    async def explain_code(self, code: str, framework: str) -> dict[str, str]:
        """Generate human-readable explanation of code."""
        prompt = self._build_explanation_prompt(code, framework)
        
        try:
            if self.gemini_available:
                explanation = call_gemini(prompt)
            elif self.openai_available:
                explanation = await self._call_openai(prompt)
            else:
                explanation = f"This is {framework} code. Enable AI to get detailed explanation."
            
            return {
                "success": True,
                "explanation": explanation or "Unable to generate explanation",
            }
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return {"success": False, "explanation": f"Error: {str(e)}"}

    async def _call_ai(self, prompt: str, max_tokens: int = 2400, temperature: float = 0.7) -> str:
        if self.gemini_available:
            raw = call_gemini(prompt)
            if raw:
                return raw
        if self.openai_available:
            raw = await self._call_openai(prompt, max_tokens=max_tokens, temperature=temperature)
            if raw:
                return raw
        return ""

    async def suggest_stack(self, description: str) -> dict[str, Any]:
        prompt = self._build_stack_prompt(description)
        raw = await self._call_ai(prompt, max_tokens=1200, temperature=0.55)
        parsed = self._extract_json_object(raw)
        if parsed:
            return {"success": True, **parsed}
        return self._fallback_stack(description)

    async def analyze_complexity(self, description: str) -> dict[str, Any]:
        prompt = self._build_complexity_prompt(description)
        raw = await self._call_ai(prompt, max_tokens=1200, temperature=0.55)
        parsed = self._extract_json_object(raw)
        if parsed:
            return {"success": True, **parsed}
        return self._fallback_complexity(description)

    async def chat_refine(
        self,
        instruction: str,
        current_code: str,
        framework: str,
        code_type: str = "component",
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        db: Optional[Session] = None,
    ) -> dict[str, Any]:
        history = []
        session = None
        if session_id and db:
            try:
                session = db.query(CodeStudioSession).filter(CodeStudioSession.id == int(session_id)).first()
            except ValueError:
                session = None
            if session:
                history = [{"role": message.role, "content": message.content} for message in session.messages]

        if db and user_id is not None and not session:
            session = CodeStudioSession(user_id=user_id, title=f"Refinement: {instruction[:40]}")
            db.add(session)
            db.commit()
            db.refresh(session)

        if session:
            history.append({"role": "user", "content": instruction})
            if db:
                db.add(CodeStudioMessage(session_id=session.id, role="user", content=instruction))
                db.commit()

        prompt = self._build_chat_refine_prompt(instruction, current_code, framework, code_type, history)
        raw = await self._call_ai(prompt, max_tokens=2600, temperature=0.7)
        updated_code = self._extract_code_block(raw) or current_code
        diff = self._compute_code_diff(current_code, updated_code)

        if session and db:
            assistant_message = raw.strip() if raw else f"Refined code for {framework}"
            db.add(CodeStudioMessage(session_id=session.id, role="assistant", content=assistant_message))
            db.commit()

        return {
            "success": True,
            "session_id": str(session.id) if session else None,
            "code": updated_code,
            "diff": diff,
            "messages": history + [{"role": "assistant", "content": raw.strip() if raw else "No response"}],
        }

    async def test_code(self, code: str, framework: str) -> dict[str, Any]:
        local_results = self._run_code_tests(code, framework)
        if self.gemini_available or self.openai_available:
            prompt = self._build_test_prompt(code, framework)
            raw = await self._call_ai(prompt, max_tokens=1500, temperature=0.2)
            parsed = self._extract_json_object(raw)
            if parsed and parsed.get("warnings") is not None:
                local_results["ai_notes"] = parsed.get("notes", raw.strip())
                local_results["warnings"] = parsed.get("warnings", local_results["warnings"])
                local_results["errors"] = parsed.get("errors", local_results["errors"])
                local_results["passed_checks"] = parsed.get("passed_checks", local_results["passed_checks"])
                local_results["total_checks"] = parsed.get("total_checks", local_results["total_checks"])
        return {"success": True, **local_results}

    async def export_platform(
        self,
        platform: str,
        description: str,
        current_code: str,
        framework: str,
        code_type: str,
    ) -> dict[str, Any]:
        prompt = self._build_export_prompt(platform, description, current_code, framework, code_type)
        raw = await self._call_ai(prompt, max_tokens=2600, temperature=0.55)
        files = self._extract_json_object(raw) or {}
        archive = {}
        if isinstance(files, dict):
            archive = self._package_files_as_zip(files.get("files", {}))

        return {
            "success": True,
            "platform": platform,
            "files": files.get("files") if isinstance(files, dict) else {},
            "instructions": files.get("instructions") if isinstance(files, dict) else "",
            "zip_base64": archive,
        }

    def get_templates(self) -> dict[str, Any]:
        return {
            "success": True,
            "templates": [
                {
                    "category": "Mobile Apps",
                    "items": [
                        {"id": "login_todo", "name": "Login + Todo App", "description": "Auth, todos, offline-first UX", "tags": ["mobile", "auth", "productivity"]},
                        {"id": "chat_app", "name": "Chat App", "description": "Real-time messaging with notifications", "tags": ["real-time", "chat", "socket"]},
                        {"id": "fitness_tracker", "name": "Fitness Tracker", "description": "Progress dashboard with charts and goals", "tags": ["health", "dashboard", "tracking"]},
                    ],
                },
                {
                    "category": "E-commerce",
                    "items": [
                        {"id": "product_showcase", "name": "Product Showcase", "description": "Landing page with cart and checkout flow", "tags": ["ecommerce", "store", "checkout"]},
                        {"id": "marketplace", "name": "Marketplace", "description": "Product listings, filters, and seller profiles", "tags": ["marketplace", "filters", "payments"]},
                    ],
                },
                {
                    "category": "Dashboards",
                    "items": [
                        {"id": "analytics_dashboard", "name": "Analytics Dashboard", "description": "Metrics, trend charts and reports", "tags": ["analytics", "admin", "data"]},
                        {"id": "project_portal", "name": "Project Portal", "description": "Task tracking with timeline and team roles", "tags": ["project", "team", "management"]},
                    ],
                },
                {
                    "category": "Education",
                    "items": [
                        {"id": "quiz_app", "name": "Quiz App", "description": "Interactive questions with score tracking", "tags": ["education", "quiz", "learning"]},
                        {"id": "course_catalog", "name": "Course Catalog", "description": "Course listing with enrollment pages", "tags": ["courses", "education", "library"]},
                    ],
                },
            ],
        }

    def save_project(
        self,
        user_id: int,
        title: str,
        description: str,
        framework: str,
        code: str,
        files: Optional[dict[str, str]] = None,
        tags: Optional[list[str]] = None,
        is_public: bool = False,
        fork_from: Optional[int] = None,
        db: Optional[Session] = None,
    ) -> dict[str, Any]:
        if db is None:
            raise ValueError("Database session is required to save projects")
        project = StudentProject(
            user_id=user_id,
            title=title.strip() or "My CodeStudio Project",
            description=description.strip()[:1000],
            framework=framework,
            code=code,
            files=files or {},
            tags=tags or [],
            is_public=is_public,
            fork_from=fork_from,
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return {
            "success": True,
            "project": {
                "id": project.id,
                "title": project.title,
                "description": project.description,
                "framework": project.framework,
                "tags": project.tags,
                "is_public": project.is_public,
                "fork_from": project.fork_from,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
            },
        }

    def get_my_projects(self, user_id: int, db: Session) -> dict[str, Any]:
        projects = db.query(StudentProject).filter(StudentProject.user_id == user_id).order_by(StudentProject.updated_at.desc()).all()
        return {
            "success": True,
            "projects": [
                {
                    "id": project.id,
                    "title": project.title,
                    "description": project.description,
                    "framework": project.framework,
                    "tags": project.tags or [],
                    "is_public": project.is_public,
                    "fork_from": project.fork_from,
                    "created_at": project.created_at.isoformat(),
                    "updated_at": project.updated_at.isoformat(),
                }
                for project in projects
            ],
        }

    def fork_project(self, user_id: int, project_id: int, db: Session) -> dict[str, Any]:
        project = db.query(StudentProject).filter(StudentProject.id == project_id).first()
        if not project:
            return {"success": False, "message": "Project not found"}

        forked = StudentProject(
            user_id=user_id,
            title=f"Fork of {project.title}",
            description=project.description,
            framework=project.framework,
            code=project.code,
            files=project.files,
            tags=project.tags or [],
            is_public=False,
            fork_from=project.id,
        )
        db.add(forked)
        db.commit()
        db.refresh(forked)
        return {
            "success": True,
            "project": {
                "id": forked.id,
                "title": forked.title,
                "description": forked.description,
                "framework": forked.framework,
                "tags": forked.tags,
                "is_public": forked.is_public,
                "fork_from": forked.fork_from,
                "created_at": forked.created_at.isoformat(),
                "updated_at": forked.updated_at.isoformat(),
            },
        }

    def _build_stack_prompt(self, description: str) -> str:
        return f"""You are an expert full-stack architect for student projects. Analyze the idea and propose a complete tech stack.

PROJECT IDEA: {description}

Return valid JSON only in this exact format:
{{
  "primary_stack": "",
  "reason": "",
  "alternatives": ["", ""],
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimated_time": "",
  "learning_resources": ["", ""]
}}

Consider deployment on free platforms, student learning, and modern job market demand.
"""

    def _build_complexity_prompt(self, description: str) -> str:
        return f"""You are an expert project analyst. Review the idea and return a complexity assessment.

PROJECT IDEA: {description}

Return valid JSON only in this exact format:
{{
  "complexity_score": 0,
  "estimated_time": "",
  "key_challenges": ["", ""],
  "resources_needed": ["", ""],
  "team_size": ""
}}

Assess effort, risks, and best platform fit.
"""

    def _build_chat_refine_prompt(
        self,
        instruction: str,
        current_code: str,
        framework: str,
        code_type: str,
        history: list[dict[str, str]],
    ) -> str:
        conversation = "\n".join([f"{item['role'].capitalize()}: {item['content']}" for item in history[-6:]])
        return f"""You are an expert {framework} developer. The user wants to iteratively refine a {code_type}.

CONTEXT:
{conversation}

CURRENT CODE:
```
{current_code[:12000]}
```

REFINEMENT REQUEST: {instruction}

Return only the completed updated code in a markdown code block and do not include any additional commentary.
"""

    def _build_test_prompt(self, code: str, framework: str) -> str:
        return f"""You are an expert code reviewer. Test this {framework} code for syntax, responsiveness, accessibility, performance, and deployment readiness.

CODE:
```
{code[:12000]}
```

Respond only with valid JSON in this exact format:
{{
  "passed_checks": <number>,
  "total_checks": <number>,
  "warnings": ["", ""],
  "errors": ["", ""],
  "notes": ""
}}
"""

    def _build_export_prompt(
        self,
        platform: str,
        description: str,
        current_code: str,
        framework: str,
        code_type: str,
    ) -> str:
        return f"""You are an expert developer preparing platform-specific export bundles.

TARGET PLATFORM: {platform}
PROJECT IDEA: {description}
LANGUAGE/FRAMEWORK: {framework}
CODE TYPE: {code_type}
EXISTING CODE:
```
{current_code[:12000]}
```

Provide a JSON object only in this exact format:
{{
  "files": {{
    "<filename>": "<file contents>",
    ...
  }},
  "instructions": "A short deployment instruction or link placeholder"
}}

Include all files needed for a minimal working {platform} package.
"""

    def _extract_json_object(self, text: str) -> Optional[dict[str, Any]]:
        if not text:
            return None
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            return None
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            try:
                payload = text[start:]
                return json.loads(payload)
            except Exception:
                return None

    def _package_files_as_zip(self, files: dict[str, str]) -> str:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_buffer:
            for filename, content in files.items():
                if isinstance(content, str):
                    zip_buffer.writestr(filename, content)
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')

    def _compute_code_diff(self, original: str, updated: str) -> str:
        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            updated.splitlines(keepends=True),
            fromfile='before',
            tofile='after',
            lineterm='',
        )
        return ''.join(diff)

    def _run_code_tests(self, code: str, framework: str) -> dict[str, Any]:
        issues = []
        score = 100
        warnings = []
        errors = []

        if framework in ('react', 'vue', 'html'):
            if '<meta name="viewport"' not in code.lower():
                warnings.append('Missing viewport meta tag for responsive behavior.')
                score -= 10
            if '<img' in code.lower() and 'alt=' not in code.lower():
                warnings.append('Images may be missing alt attributes.')
                score -= 10
        elif framework in ('flask', 'fastapi'):
            try:
                compile(code, '<string>', 'exec')
            except SyntaxError as err:
                errors.append(f'Python syntax error: {err}')
                score -= 40
        else:
            if '<html' in code.lower() and '<head' not in code.lower():
                warnings.append('HTML code may be missing a head section.')
                score -= 10

        if 'aria-' not in code.lower() and 'role=' not in code.lower():
            warnings.append('Consider adding ARIA labels and roles for accessibility.')
            score -= 10
        if 'console.log' in code.lower():
            warnings.append('Remove console.log statements for production readiness.')
            score -= 5

        if score < 0:
            score = 0

        return {
            'complexity_score': score,
            'estimated_time': '4-8 hours' if score > 70 else '8-14 hours',
            'key_challenges': ['Responsive design', 'Accessibility', 'Deployment readiness'],
            'resources_needed': ['Hosting platform', 'Domain name', 'Version control'],
            'team_size': '1-2 people',
            'passed_checks': max(0, 5 - len(errors)),
            'total_checks': 5,
            'warnings': warnings,
            'errors': errors,
            'ai_notes': '',
        }

    def _fallback_stack(self, description: str) -> dict[str, Any]:
        base = 'React + Node.js + Tailwind'
        return {
            'success': True,
            'primary_stack': base,
            'reason': 'Modern student-friendly stack with excellent community support and easy deployment.',
            'alternatives': ['Firebase + React', 'Django + HTMX'],
            'difficulty': 'Intermediate',
            'estimated_time': '4-6 hours',
            'learning_resources': [
                'https://reactjs.org/docs/getting-started.html',
                'https://vercel.com/docs',
            ],
        }

    def _fallback_complexity(self, description: str) -> dict[str, Any]:
        return {
            'success': True,
            'complexity_score': 60,
            'estimated_time': '6-10 hours',
            'key_challenges': ['Responsive layout', 'State management', 'Deployment'],
            'resources_needed': ['Hosting plan', 'SSL certificate', 'Version control'],
            'team_size': '1-2 people',
        }

    def _extract_code_block(self, text: str) -> str:
        """Extract code from markdown code block."""
        if not text:
            return ""
        
        pattern = r"```(?:\w+)?\s*\n([\s\S]*?)```"
        matches = re.findall(pattern, text)
        if matches:
            return matches[0].strip()
        return text.strip()

    def _build_prototype_prompt(
        self,
        description: str,
        template_type: str,
        color_scheme: str,
    ) -> str:
        """Build prompt for prototype generation."""
        color_details = {
            "light": "Light theme with white/gray background and dark text",
            "dark": "Dark theme (#0f1117 or similar) with light text",
            "brand": "Professional brand theme with accent colors",
        }
        color_hint = color_details.get(color_scheme, "professional styling")

        template_hints = {
            "landing_page": "hero section, features, call-to-action, footer",
            "dashboard": "sidebar, main content area, cards, charts placeholder",
            "form": "form with validation, input fields, submission button",
            "ecommerce": "product grid, filters, shopping cart, checkout",
            "blank": "flexible layout ready for customization",
        }
        template_hint = template_hints.get(template_type, "modern layout")

        return f"""You are a frontend expert. Build a complete, beautiful, interactive webpage.

DESCRIPTION: {description}
TEMPLATE: {template_type} - {template_hint}
STYLE: {color_hint}

BUILD REQUIREMENTS:
- Use HTML5, Tailwind CSS (CDN), and vanilla JavaScript
- Fully responsive (mobile, tablet, desktop)
- Include smooth animations and hover effects
- Add FontAwesome icons (CDN)
- Self-contained: all CSS in <style>, JS in <script>
- Modern, professional design
- Functional interactions (buttons work, forms validate)
- No external frameworks needed (except CDN)

Respond with ONLY a single HTML file wrapped in markdown code block.
Start with ```html and end with ```
No explanations, only the complete HTML file."""

    def _build_refine_prompt(
        self,
        existing_code: str,
        instruction: str,
        framework: str,
        code_type: str,
    ) -> str:
        """Build prompt for code refinement."""
        return f"""You are a {framework} expert. Refine this {code_type} code.

EXISTING CODE:
```
{existing_code[:8000]}
```

USER INSTRUCTION: {instruction}

REQUIREMENTS:
- Keep all existing functionality unless told to remove
- Implement the user's instruction exactly
- Return complete, working code
- Maintain {framework} best practices
- Keep the same code structure where possible

Respond with ONLY the complete updated code in a markdown code block.
No explanations, only code."""

    def _build_explanation_prompt(self, code: str, framework: str) -> str:
        """Build prompt for code explanation."""
        return f"""Explain this {framework} code in simple terms for a developer.

CODE:
```
{code[:6000]}
```

EXPLAIN:
1. What this code does (1-2 sentences)
2. Key components/functions (list with brief descriptions)
3. How to use/run it
4. How to modify it
5. Best practices shown in this code

Be concise and technical but understandable."""

    def _extract_code_block(self, text: str) -> str:
        """Extract code from markdown code block."""
        if not text:
            return ""
        
        # Try to extract from ```language ... ``` format
        pattern = r"```(?:\w+)?\s*\n([\s\S]*?)```"
        matches = re.findall(pattern, text)
        if matches:
            return matches[0].strip()
        
        # Fallback: return text as-is if it looks like code
        return text.strip()

    def _extract_html_block(self, text: str) -> str:
        """Extract HTML from markdown code block."""
        if not text:
            return self._fallback_html_basic()
        
        # Try to extract from ```html ... ``` format
        pattern = r"```(?:html)?\s*\n([\s\S]*?)```"
        matches = re.findall(pattern, text)
        if matches:
            return matches[0].strip()
        
        # If it starts with <!DOCTYPE, it's probably HTML
        if text.strip().startswith("<!DOCTYPE") or text.strip().startswith("<html"):
            return text.strip()
        
        return self._fallback_html_basic()

    def _generate_explanation(self, code: str, framework: str) -> str:
        """Quick explanation of generated code."""
        return f"Generated {framework} code ready to use. Customize as needed."

    def _fallback_component(
        self,
        description: str,
        framework: str,
        typescript: bool,
    ) -> dict[str, Any]:
        """Fallback component when AI is unavailable."""
        if framework == "react":
            code = f"""import React, {{useState}} from 'react';

export default function Component() {{
  const [state, setState] = useState('');

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{description[:50]}</h1>
      <p className="text-gray-600 mb-4">
        This is a placeholder. Enable Gemini API for AI-generated code.
      </p>
      <button 
        onClick={{() => setState(new Date().toLocaleTimeString())}}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try it
      </button>
      {{state && <p className="mt-4 text-sm text-gray-500">Updated: {{state}}</p>}}
    </div>
  );
}}"""
        elif framework == "vue":
            code = f"""<template>
  <div class="p-6 bg-gray-50 rounded-lg">
    <h1 class="text-2xl font-bold mb-4">{description[:50]}</h1>
    <p class="text-gray-600 mb-4">Placeholder - enable Gemini API for full generation</p>
    <button @click="update" class="px-4 py-2 bg-blue-600 text-white rounded">
      Try it
    </button>
    <p v-if="state" class="mt-4 text-sm text-gray-500">{{{{ state }}}}</p>
  </div>
</template>

<script setup>
import {{ ref }} from 'vue';
const state = ref('');
const update = () => {{ state.value = new Date().toLocaleTimeString(); }};
</script>"""
        elif framework in ("flask", "fastapi"):
            imports = 'flask import Flask, render_template_string' if framework == 'flask' else 'fastapi import FastAPI\\nfrom fastapi.middleware.cors import CORSMiddleware'
            code = f"""# Placeholder - enable Gemini API for full {framework.upper()} generation
# Description: {description[:100]}

from {imports}

app = {'Flask' if framework == 'flask' else 'FastAPI'}(__name__)

@app.route('/')
def home():
    return {{"message": "Enable Gemini API for AI code generation"}}
"""
        else:  # html
            code = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CodeStudio</title>
  <style>
    body {{ font-family: system-ui; background: #f5f5f5; margin: 0; padding: 20px; }}
    .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
    h1 {{ color: #333; }}
    p {{ color: #666; }}
    button {{ padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>{description[:60]}</h1>
    <p>Placeholder component. Enable Gemini API for AI-generated code.</p>
    <button onclick="alert('Enable AI for interactivity')">Try it</button>
  </div>
</body>
</html>"""

        return {
            "success": True,
            "code": code,
            "explanation": "Fallback code - AI unavailable. Enable Gemini API for better results.",
            "language": "typescript" if typescript and framework == "react" else "javascript" if framework in ("react", "vue") else "python",
            "framework": framework,
        }

    def _fallback_prototype(
        self,
        description: str,
        template_type: str,
        color_scheme: str,
    ) -> dict[str, Any]:
        """Fallback prototype HTML when AI unavailable."""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prototype</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ 
      font-family: system-ui, -apple-system, sans-serif;
      {"background: #f5f5f5; color: #333;" if color_scheme == "light" else "background: #1a1a1a; color: #f5f5f5;" if color_scheme == "dark" else "background: #fff; color: #222;"}
      line-height: 1.6;
    }}
    header {{ padding: 20px; border-bottom: 1px solid {"#ddd" if color_scheme != "dark" else "#333"}; }}
    .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
    h1 {{ font-size: 2em; margin: 20px 0; }}
    button {{ padding: 12px 24px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em; }}
    button:hover {{ background: #0052a3; }}
  </style>
</head>
<body>
  <header>
    <h1><i class="fas fa-cube"></i> {description[:50]}</h1>
  </header>
  <div class="container">
    <p>Placeholder template ({template_type}). Enable Gemini API for AI-generated prototypes.</p>
    <button onclick="alert('Interactive when AI is enabled')">Get Started</button>
  </div>
</body>
</html>"""
        return {
            "success": True,
            "html": html,
            "template_type": template_type,
            "color_scheme": color_scheme,
        }

    def _fallback_html_basic(self) -> str:
        """Basic fallback HTML."""
        return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CodeStudio</title>
  <style>
    body { font-family: system-ui; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CodeStudio</h1>
    <p>Enable Gemini API to generate code and prototypes.</p>
  </div>
</body>
</html>"""

    async def _call_openai(self, prompt: str, max_tokens: int = 3000, temperature: float = 0.7) -> str:
        """Call OpenAI API as fallback."""
        try:
            response_content = openai_service._create_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response_content or ""
        except Exception as e:
            logger.error(f"OpenAI call failed: {e}")
            return ""

    async def generate_mock_data(self, description: str) -> dict[str, Any]:
        """Generate a highly realistic, rich mock database seeding JSON dataset based on project description."""
        prompt = f"""You are an expert data engineer. Generate a highly realistic, rich mock database seeding JSON dataset based on this project description:
        
PROJECT DESCRIPTION: {description}

Generate exactly 10 comprehensive records. Ensure the JSON is well-formed, contains realistic names, timestamps, categories, and numeric values matching the description.

Return ONLY the raw JSON array wrapped in markdown code blocks. Start with ```json and end with ```. Do not include any additional commentary or text.
"""
        try:
            raw = await self._call_ai(prompt, max_tokens=1500, temperature=0.7)
            extracted = self._extract_json_object(raw)
            if not extracted:
                start = raw.find('[')
                end = raw.rfind(']')
                if start != -1 and end != -1:
                    try:
                        extracted = json.loads(raw[start:end + 1])
                    except Exception:
                        extracted = None
            
            if extracted:
                return {"success": True, "data": extracted}
            
            return {
                "success": True, 
                "data": [
                    {"id": i, "name": f"Mock Item {i}", "category": "General", "value": i * 15, "created_at": "2026-05-26T12:00:00Z"}
                    for i in range(1, 6)
                ]
            }
        except Exception as e:
            logger.error(f"Mock data generation failed: {e}")
            return {"success": False, "error": str(e)}

    async def generate_pitch_deck(self, description: str, code: str) -> dict[str, Any]:
        """Generate a complete Markdown pitch deck derived from the project description and code."""
        prompt = f"""You are a world-class startup advisor and hackathon judge. Generate a professional Markdown pitch deck outline based on the following project description and code.
        
PROJECT DESCRIPTION: {description}
GENERATED CODE SNIPPET:
```
{code[:4000]}
```

Provide the pitch deck structured in slides separated by horizontal lines (---). The deck MUST include the following slides:
1. Title & Value Proposition
2. The Core Problem Statement
3. Your Unique Solution Approach
4. High-Level Technical Architecture & Stack
5. Key Gaps Solved (Originality)
6. Future Build Roadmap (4-Week Plan)

Use bullet points, bold accents, and clean spacing. Return only the raw Markdown contents. Do not include any HTML frames or explanations outside.
"""
        try:
            raw = await self._call_ai(prompt, max_tokens=2200, temperature=0.7)
            if raw:
                return {"success": True, "markdown": raw.strip()}
            return {"success": False, "error": "AI failed to respond"}
        except Exception as e:
            logger.error(f"Pitch deck generation failed: {e}")
            return {"success": False, "error": str(e)}

    def check_originality(self, code: str, db: Session) -> dict[str, Any]:
        """Scan generated code against stored database documents to check for plagiarism/similarity."""
        try:
            from backend.services.plagiarism_service import plagiarism_service
            clean_text = re.sub(r'#.*|//.*|/\*[\s\S]*?\*/|<!--[\s\S]*?-->', '', code)
            result = plagiarism_service.check_plagiarism(clean_text, db)
            return {"success": True, **result}
        except Exception as e:
            logger.error(f"Originality check failed: {e}")
            return {"success": False, "error": str(e)}


# Create singleton instance
codestudio_service = CodeStudioService()
