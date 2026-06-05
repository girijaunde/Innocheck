Created At: 2026-06-02T15:45:32Z
Completed At: 2026-06-02T15:45:32Z
File Path: `file:///c:/Users/Admin/Desktop/Inoocheck/backend/app_simple.py`
Total Lines: 2248
Total Bytes: 106706
Showing lines 1 to 200
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
"""
InnoCheck - Simplified Backend API
FastAPI server for hackathon innovation suite
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from datetime import datetime
import random

# ==================== INITIALIZE APP ====================

app = FastAPI(
    title="InnoCheck API",
    description="AI-Powered Hackathon Innovation Suite",
    version="1.0.0"
)

# ==================== CORS CONFIGURATION ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== REQUEST MODELS ====================

class IdeaValidationRequest(BaseModel):
    problem_statement: str
    suggestions: Optional[str] = ""
    session_id: Optional[int] = None
    mode: Optional[str] = "full"
    language: Optional[str] = "english"
    sources: Optional[List[str]] = ["arxiv", "github", "devpost"]

class CodeGenerationRequest(BaseModel):
    description: str
    framework: str
    include_comments: bool = False
    typescript: bool = False
    responsive: bool = True
class CodegenRequest(BaseModel):
    problem_statement: str
    la
<truncated 5649 bytes>
"summary": "Describes low-cost chemical and optical sensors deployed for remote community water storage tracking.",
                    "url": "https://arxiv.org/abs/2403.0112",
                    "gap": "Lacks proactive epidemic outbreak prediction models and community health symptom correlation."
                },
                {
                    "title": "Community-Driven Syndromic Surveillance in Low-Resource Settings",
                    "source": "GitHub",
                    "venue": "GitHub/healthcare-surveillance",
                    "similarity": 60,
                    "summary": "An SMS-based symptom reporting hub designed for rural medical centers.",
                    "url": "https://github.com/example/healthcare-surveillance",
                    "gap": "Operates as a reactive reporting database rather than a real-time IoT early-warning predictive system."
                }
            ]
            improvement_suggestions = [
                "Utilize low-power LoRaWAN networks to ensure sensor telemetry reaches the local hub in zero-internet zones.",
                "Implement symptom-based crowd-sourced reporting with simple offline-first SMS/USSD integrations for villagers.",
                "Apply light gradient boosting models directly on the edge gateway for local predictive infection warnings."
            ]
            potential_challenges = [
                "High humidity and flood risks in Northeast India requiring robust waterproof physical casing.",
                "Initial hesitation from the rural populace; requires simple regional language mobile interface."
            ]
            success_metrics = [
                "90%+ coverage of village clusters within 6 months.",
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.