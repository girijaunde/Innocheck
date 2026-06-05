"""Natural language to prototype code: multi-framework generation, refine, explain."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from backend.utils.llm import call_gemini

TEMPLATES_PATH = Path(__file__).resolve().parents[2] / "data" / "prototype_templates.json"

FRAMEWORKS = ("html", "react", "vue", "flask", "fastapi")

# Domain templates (AgriTech, HealthTech, etc.) — keys match template ids in JSON
DOMAIN_KEYS = ("generic", "agritech", "healthtech", "fintech", "edtech", "sustainability")


def load_templates() -> dict[str, Any]:
    if not TEMPLATES_PATH.exists():
        return {"templates": []}
    with open(TEMPLATES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def list_templates_public() -> list[dict[str, Any]]:
    data = load_templates()
    return data.get("templates", [])


def _build_generation_prompt(
    description: str,
    framework: str,
    template_id: str | None,
    extra_context: str | None,
) -> str:
    tpl_hint = ""
    if template_id and template_id != "generic":
        tpl_hint = f" Prefer domain focus: {template_id} (use relevant UX copy and labels)."

    ctx = (extra_context or "").strip()
    ctx_block = f"\nAdditional context from validation/suggestion:\n{ctx}\n" if ctx else ""

    fw_instructions = {
        "html": (
            "Output a SINGLE complete HTML file with embedded CSS in <style> and JS in <script>. "
            "No external CDN required except optional Google Fonts. Mobile-friendly."
        ),
        "react": (
            "Output a single React functional component file using only React 18 hooks. "
            "Use inline styles or a style object. Export default. No JSX file split."
        ),
        "vue": (
            "Output a single Vue 3 SFC: <template>, <script setup>, <style scoped>. "
            "Composition API only."
        ),
        "flask": (
            "Output a minimal Flask app: app.py with routes, templates folder as string HTML in code "
            "or render_template_string. Include requirements comment."
        ),
        "fastapi": (
            "Output a minimal FastAPI app with CORS, one POST and one GET, Pydantic model, "
            "and in-memory demo store. Include uvicorn run comment."
        ),
    }
    instr = fw_instructions.get(framework, fw_instructions["html"])

    return (
        "You are a senior hackathon engineer. Generate runnable prototype code from the description.\n\n"
        f"Framework: {framework}\n"
        f"{instr}\n"
        f"{tpl_hint}\n"
        f"{ctx_block}\n"
        f"User description:\n{description}\n\n"
        "Respond with EXACTLY this structure (markdown code fences):\n"
        "```\nFILENAME: main or appropriate single file name\n```\n"
        "```LANG\n...full file content...\n```\n"
        "If multiple files are absolutely needed, repeat FILENAME blocks. Prefer one file."
    )


def _build_refine_prompt(
    framework: str,
    current_code: str,
    instruction: str,
) -> str:
    return (
        f"You are refining {framework} prototype code.\n\n"
        f"Current code:\n```\n{current_code[:12000]}\n```\n\n"
        f"User change request: {instruction}\n\n"
        "Return the FULL updated code only, using the same FILENAME + fenced block format as before."
    )


def _build_explain_prompt(code: str) -> str:
    return (
        "Explain the following code in plain English for a student hackathon team.\n"
        "Use short sections: Purpose, Main parts, How to run, Ideas to extend.\n\n"
        f"Code:\n```\n{code[:14000]}\n```"
    )


def _parse_code_blocks(text: str) -> list[dict[str, str]]:
    """Parse FILENAME: lines + fenced code into [{filename, content}]."""
    if not text:
        return []
    files: list[dict[str, str]] = []
    paired = re.compile(
        r"FILENAME:\s*([^\n]+)\s*\n```(?:\w*)?\s*\n([\s\S]*?)```",
        re.IGNORECASE | re.MULTILINE,
    )
    for m in paired.finditer(text):
        files.append({"filename": m.group(1).strip(), "content": m.group(2).strip()})
    if not files:
        for m in re.finditer(r"```(?:\w*)?\s*\n([\s\S]*?)```", text):
            body = m.group(1).strip()
            if body:
                files.append({"filename": "generated.txt", "content": body})
    if not files and text.strip():
        files.append({"filename": "generated.txt", "content": text.strip()})
    return files


def _fallback_html(description: str) -> str:
    safe = description.replace("<", "&lt;").replace(">", "&gt;")[:500]
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>InnoCheck Prototype</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ font-family: system-ui, sans-serif; margin: 0; background: #0f1117; color: #e5e7eb; min-height: 100vh; }}
    .wrap {{ max-width: 720px; margin: 0 auto; padding: 24px; }}
    h1 {{ color: #4f8cff; }}
    .card {{ background: #171a23; border: 1px solid #2a3557; border-radius: 12px; padding: 16px; margin-top: 16px; }}
    button {{ background: #4f8cff; color: #fff; border: 0; padding: 10px 16px; border-radius: 8px; cursor: pointer; }}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Prototype</h1>
    <p>Based on: {safe}</p>
    <div class="card">
      <p>This is a static fallback demo. Set GEMINI_API_KEY for AI-generated code.</p>
      <button type="button" onclick="alert('Hackathon demo!')">Try action</button>
    </div>
  </div>
</body>
</html>"""


def _fallback_python_fastapi(description: str) -> str:
    safe = repr(description[:300])
    return f'''"""Generated prototype — set GEMINI_API_KEY for full AI output."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="InnoCheck Prototype")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Item(BaseModel):
    text: str

STORE = []

@app.get("/")
def root():
    return {{"message": "Hackathon prototype", "idea": {safe}}}

@app.post("/demo")
def demo(body: Item):
    STORE.append(body.text)
    return {{"ok": True, "count": len(STORE)}}

# uvicorn module:app --reload
'''


def generate_prototype(
    description: str,
    framework: str,
    template_id: str | None = None,
    extra_context: str | None = None,
) -> dict[str, Any]:
    fw = framework.lower().strip()
    if fw not in FRAMEWORKS:
        fw = "html"

    prompt = _build_generation_prompt(description, fw, template_id, extra_context)
    raw = call_gemini(prompt)
    files = _parse_code_blocks(raw) if raw else []

    primary_content = ""
    primary_name = "index.html" if fw == "html" else "App.jsx" if fw == "react" else "main.py"
    if files:
        primary_content = files[0]["content"]
        primary_name = files[0].get("filename", primary_name)
    else:
        if fw == "html":
            primary_content = _fallback_html(description)
        elif fw in ("flask", "fastapi"):
            primary_content = _fallback_python_fastapi(description)
        else:
            primary_content = f"// {fw} prototype\n// Set GEMINI_API_KEY for AI generation.\n// Idea: {description[:200]}"

    return {
        "framework": fw,
        "template_id": template_id or "generic",
        "files": files if files else [{"filename": primary_name, "content": primary_content}],
        "primary_file": primary_name,
        "raw_model_output": raw[:2000] if raw else "",
    }


def refine_prototype(framework: str, current_code: str, instruction: str) -> dict[str, Any]:
    prompt = _build_refine_prompt(framework, current_code, instruction)
    raw = call_gemini(prompt)
    files = _parse_code_blocks(raw) if raw else []
    if files:
        return {
            "framework": framework,
            "files": files,
            "primary_file": files[0].get("filename", "refined"),
        }
    return {
        "framework": framework,
        "files": [{"filename": "refined", "content": current_code}],
        "primary_file": "refined",
    }


def explain_code(code: str) -> dict[str, str]:
    prompt = _build_explain_prompt(code)
    text = call_gemini(prompt)
    if not text:
        text = (
            "Purpose: This code implements a small demo for your hackathon idea.\n"
            "Main parts: Structure follows the chosen framework conventions.\n"
            "How to run: For HTML, open in a browser; for FastAPI, run uvicorn.\n"
            "Ideas to extend: Add persistence, auth, and real API integrations."
        )
    return {"explanation": text}


def match_domain_from_text(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ("crop", "farm", "agri", "कृषी")):
        return "agritech"
    if any(k in t for k in ("health", "medical", "hospital", "patient")):
        return "healthtech"
    if any(k in t for k in ("pay", "bank", "fraud", "wallet")):
        return "fintech"
    if any(k in t for k in ("school", "learn", "student", "classroom")):
        return "edtech"
    if any(k in t for k in ("waste", "carbon", "climate", "solar")):
        return "sustainability"
    return "generic"
