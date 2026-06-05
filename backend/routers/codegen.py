from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/generate", tags=["codegen"])


class CodeGenerationRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=4000)
    framework: str = "react"
    include_comments: bool = False
    typescript: bool = False
    responsive: bool = True


def _template_for(framework: str) -> str:
    fw = framework.lower()
    templates = {
        "react": """import React from "react";

export default function App() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>InnoCheck Generated React Prototype</h1>
      <p>Start editing this component to build your project.</p>
    </main>
  );
}
""",
        "vue": """<template>
  <main style="padding:24px;font-family:system-ui">
    <h1>InnoCheck Generated Vue Prototype</h1>
    <p>Start editing this component to build your project.</p>
  </main>
</template>
""",
        "flask": """from flask import Flask, jsonify

app = Flask(__name__)

@app.get("/")
def health():
    return jsonify({"status": "ok", "message": "Flask prototype ready"})
""",
        "fastapi": """from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def health():
    return {"status": "ok", "message": "FastAPI prototype ready"}
""",
    }
    return templates.get(fw, "<!-- InnoCheck generated HTML prototype -->\n<h1>Hello from InnoCheck</h1>")


@router.post("/code")
def generate_code(payload: CodeGenerationRequest) -> dict[str, Any]:
    try:
        code = _template_for(payload.framework)
        header = ""
        if payload.include_comments:
            header = f"// Generated for: {payload.description[:120]}\n"
        return {
            "success": True,
            "framework": payload.framework.lower(),
            "code": f"{header}{code}",
            "explanation": "Base scaffold generated. Extend this starter with your project logic.",
            "preview_html": "<!doctype html><html><body><h3>Generated scaffold ready.</h3></body></html>",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {e!s}") from e
