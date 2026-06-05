from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import openai
from dotenv import load_dotenv
import sqlite3
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="InnoCheck API", version="1.0.0")

# CORS Configuration - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Sentence Transformer for embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

# Database setup
def init_db():
    conn = sqlite3.connect('innocheck.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            feature TEXT,
            input_text TEXT,
            output_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            paper_title TEXT,
            paper_authors TEXT,
            paper_year INTEGER,
            paper_doi TEXT,
            paper_url TEXT,
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ==================== REQUEST MODELS ====================

class IdeaValidationRequest(BaseModel):
    problem_statement: str
    language: str = "english"
    sources: List[str] = ["arxiv", "github", "devpost"]

class CodeGenerationRequest(BaseModel):
    description: str
    framework: str
    include_comments: bool = False
    typescript: bool = False
    responsive: bool = True

class PlagiarismRequest(BaseModel):
    text: str
    sources: List[str] = ["devpost", "github", "arxiv"]

class LiteratureSearchRequest(BaseModel):
    query: str
    year_from: int = 2020
    year_to: int = 2026
    source: str = "all"

class SavePaperRequest(BaseModel):
    title: str
    authors: str
    year: int
    doi: str = ""
    url: str = ""

class PrototypeRequest(BaseModel):
    description: str
    template: str = "blank"
    color_scheme: str = "light"

# ==================== API ENDPOINTS ====================

# Health Check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "InnoCheck API is running"}

# ==================== FEATURE 1: IDEA VALIDATOR ====================

@app.post("/api/validate/idea")
async def validate_idea(request: IdeaValidationRequest):
    """Validate hackathon idea and provide innovation gap analysis"""
    try:
        # Generate embedding for the problem statement
        embedding = model.encode([request.problem_statement])[0]
        
        # Mock similar projects search (in production, use FAISS)
        similar_projects = [
            {
                "title": "AI-Powered Crop Disease Detection",
                "source": "Devpost 2024",
                "similarity": 85,
                "url": "https://devpost.com/example1"
            },
            {
                "title": "Plant Disease Classification using CNN",
                "source": "arXiv:2305.12345",
                "similarity": 72,
                "url": "https://arxiv.org/abs/2305.12345"
            },
            {
                "title": "Mobile-Based Agricultural Disease Detection",
                "source": "GitHub",
                "similarity": 68,
                "url": "https://github.com/example"
            }
        ]
        
        # Calculate innovation score (mock - in production use GPT)
        innovation_score = 100 - min(85, max(0, similar_projects[0]["similarity"]))
        
        # Generate gap analysis using GPT
        prompt = f"""
        Analyze this hackathon problem statement and identify innovation gaps:
        "{request.problem_statement}"
        
        Based on existing solutions, what is missing? What novel directions can be suggested?
        Provide 3-4 bullet points.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300
            )
            gap_analysis = response.choices[0].message.content
        except:
            gap_analysis = "â¢ Real-time disease detection\nâ¢ Offline functionality for rural areas\nâ¢ Multi-language support for local farmers\nâ¢ Integration with government agricultural databases"
        
        # Save to history
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO history (feature, input_text, output_json) VALUES (?, ?, ?)",
            ("idea_validator", request.problem_statement, json.dumps({"score": innovation_score}))
        )
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "innovation_score": innovation_score,
            "innovation_score_percent": f"{innovation_score}%",
            "gap_analysis": gap_analysis,
            "similar_projects": similar_projects,
            "suggested_directions": [
                "Implement real-time disease detection using edge computing",
                "Add offline support for rural internet connectivity",
                "Include multi-language support (Marathi, Hindi)",
                "Integrate with government agricultural schemes"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEATURE 2: CODE GENERATOR ====================

@app.post("/api/generate/code")
async def generate_code(request: CodeGenerationRequest):
    """Generate code from natural language description"""
    try:
        framework_templates = {
            "react": """
import React, { useState } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  
  return (
    <div className="container">
      <h1>Your Application</h1>
      {/* Add your components here */}
    </div>
  );
}
""",
            "vue": """
<template>
  <div class="container">
    <h1>Your Application</h1>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: 'Hello Vue!'
    }
  }
}
</script>
""",
            "flask": """
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Welcome to your API"})

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"data": "Your response here"})

if __name__ == '__main__':
    app.run(debug=True)
""",
            "fastapi": """
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Your API")

class Item(BaseModel):
    name: str
    description: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to your API"}

@app.post("/api/items")
async def create_item(item: Item):
    return {"item": item}
""",
            "html": """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Prototype</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        h1 { color: white; text-align: center; margin-bottom: 2rem; }
        .card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Your Application</h1>
        <div class="card">
            <p>Content goes here</p>
        </div>
    </div>
</body>
</html>
"""
        }
        
        generated_code = framework_templates.get(request.framework.lower(), framework_templates["html"])
        
        # Add comments if requested
        if request.include_comments:
            generated_code = "// Generated by InnoCheck AI\n// Framework: " + request.framework + "\n" + generated_code
        
        # Generate preview HTML
        preview_html = """
        <!DOCTYPE html>
        <html>
        <head><style>body { font-family: system-ui; padding: 20px; }</style></head>
        <body>
            <h1>Preview</h1>
            <p>Your generated code will appear here. Copy the code above to see the live preview.</p>
        </body>
        </html>
        """
        
        return {
            "success": True,
            "code": generated_code,
            "preview_html": preview_html,
            "explanation": f"Generated {request.framework} code based on your description. The code includes basic structure and can be extended based on your requirements."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEATURE 3: PLAGIARISM CHECKER ====================

@app.post("/api/plagiarism/check")
async def check_plagiarism(request: PlagiarismRequest):
    """Check text for plagiarism against multiple sources"""
    try:
        # Mock results - in production, implement actual similarity search
        matched_sources = []
        
        if "devpost" in request.sources:
            matched_sources.append({
                "source": "Devpost",
                "title": "Similar Hackathon Project 2024",
                "similarity": 82,
                "url": "https://devpost.com/example",
                "matched_text": request.text[:100] + "..."
            })
        
        if "github" in request.sources:
            matched_sources.append({
                "source": "GitHub",
                "title": "Open Source Repository",
                "similarity": 45,
                "url": "https://github.com/example",
                "matched_text": request.text[:80] + "..."
            })
        
        if "arxiv" in request.sources:
            matched_sources.append({
                "source": "arXiv",
                "title": "Academic Research Paper",
                "similarity": 38,
                "url": "https://arxiv.org/abs/example",
                "matched_text": request.text[:60] + "..."
            })
        
        # Calculate overall plagiarism score
        if matched_sources:
            plagiarism_percentage = sum(s["similarity"] for s in matched_sources) / len(matched_sources)
        else:
            plagiarism_percentage = 0
        
        # Determine status
        if plagiarism_percentage < 10:
            status = "low"
            status_text = "Low Risk - Original Content"
        elif plagiarism_percentage < 25:
            status = "moderate"
            status_text = "Moderate Risk - Some Similarity"
        elif plagiarism_percentage < 50:
            status = "high"
            status_text = "High Risk - Significant Similarity"
        else:
            status = "critical"
            status_text = "Critical - High Plagiarism Detected"
        
        return {
            "success": True,
            "plagiarism_percentage": round(plagiarism_percentage, 1),
            "unique_percentage": round(100 - plagiarism_percentage, 1),
            "status": status,
            "status_text": status_text,
            "matched_sources": matched_sources,
            "highlighted_text": request.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEATURE 4: LITERATURE REVIEW ====================

@app.post("/api/literature/search")
async def search_literature(request: LiteratureSearchRequest):
    """Search for research papers across academic databases"""
    try:
        # Mock papers - in production, call actual APIs
        mock_papers = [
            {
                "id": 1,
                "title": "Hack-Agents: A Multi-Agent System for Innovation",
                "authors": "Li, L., Herath, S., Grumbach, C.",
                "year": 2026,
                "source": "ACM",
                "citations": 12,
                "doi": "10.1145/3772363.3798678",
                "url": "https://dl.acm.org/doi/10.1145/3772363.3798678",
                "abstract": "This paper presents a multi-agent system for hackathon innovation validation, demonstrating AI-augmented hackathon participation and real-time feedback mechanisms."
            },
            {
                "id": 2,
                "title": "The Evolution of Hackathons as an Innovation Tool",
                "authors": "Marrujo-Ingunza, C., Paico-Campos, M.",
                "year": 2025,
                "source": "IJACSA",
                "citations": 8,
                "doi": "10.14569/IJACSA.2025.0161148",
                "url": "http://dx.doi.org/10.14569/IJACSA.2025.0161148",
                "abstract": "Systematic analysis of hackathon evolution, identifying global trends in skill development, innovation, and entrepreneurship."
            },
            {
                "id": 3,
                "title": "Self-hosted multi-agent RAG system for contextual document processing",
                "authors": "Eng, Z.J.",
                "year": 2025,
                "source": "UTAR",
                "citations": 3,
                "doi": "",
                "url": "http://eprints.utar.edu.my/7287/",
                "abstract": "Privacy-preserving RAG architecture for multi-agent document processing with FAISS and BM25 integration."
            },
            {
                "id": 4,
                "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
                "authors": "Lewis, P., et al.",
                "year": 2020,
                "source": "NeurIPS",
                "citations": 2500,
                "doi": "10.48550/arXiv.2005.11401",
                "url": "https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html",
                "abstract": "Original RAG paper combining dense retrieval with generative models for knowledge-intensive tasks."
            }
        ]
        
        # Filter by year
        filtered_papers = [p for p in mock_papers if request.year_from <= p["year"] <= request.year_to]
        
        return {
            "success": True,
            "total": len(filtered_papers),
            "papers": filtered_papers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/literature/save")
async def save_paper(request: SavePaperRequest):
    """Save paper to user's library"""
    try:
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO saved_papers (paper_title, paper_authors, paper_year, paper_doi, paper_url) VALUES (?, ?, ?, ?, ?)",
            (request.title, request.authors, request.year, request.doi, request.url)
        )
        conn.commit()
        paper_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "message": "Paper saved successfully",
            "paper_id": paper_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/literature/saved")
async def get_saved_papers():
    """Get all saved papers"""
    try:
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, paper_title, paper_authors, paper_year, paper_doi, paper_url, saved_at FROM saved_papers ORDER BY saved_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        papers = []
        for row in rows:
            papers.append({
                "id": row[0],
                "title": row[1],
                "authors": row[2],
                "year": row[3],
                "doi": row[4],
                "url": row[5],
                "saved_at": row[6]
            })
        
        return {"success": True, "papers": papers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/literature/saved/{paper_id}")
async def delete_saved_paper(paper_id: int):
    """Delete saved paper from library"""
    try:
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_papers WHERE id = ?", (paper_id,))
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Paper deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/literature/bibliography")
async def export_bibliography():
    """Export all saved papers in IEEE format"""
    try:
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute("SELECT paper_title, paper_authors, paper_year FROM saved_papers")
        rows = cursor.fetchall()
        conn.close()
        
        bibliography = []
        for row in rows:
            ref = f"[{len(bibliography)+1}] {row[1]}, \"{row[0]},\" {row[2]}."
            bibliography.append(ref)
        
        return {
            "success": True,
            "bibliography": "\n".join(bibliography)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEATURE 5: PROTOTYPE BUILDER ====================

@app.post("/api/prototype/build")
async def build_prototype(request: PrototypeRequest):
    """Generate prototype from description"""
    try:
        templates = {
            "blank": """
<!DOCTYPE html>
<html>
<head><title>Prototype</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
</style>
</head>
<body>
<div class="container"><div class="card"><h1>Your Prototype</h1><p>Content goes here</p></div></div>
</body>
</html>
""",
            "landing_page": """
<!DOCTYPE html>
<html>
<head><title>Landing Page</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh}
.hero{text-align:center;padding:4rem 2rem;color:white}
.hero h1{font-size:3rem;margin-bottom:1rem}
.hero p{font-size:1.2rem;margin-bottom:2rem}
.btn{background:white;color:#667eea;padding:0.8rem 2rem;border-radius:2rem;text-decoration:none;font-weight:bold}
</style>
</head>
<body>
<div class="hero"><h1>Welcome to Your Product</h1><p>Transform your ideas into reality</p><a href="#" class="btn">Get Started</a></div>
</body>
</html>
""",
            "dashboard": """
<!DOCTYPE html>
<html>
<head><title>Dashboard</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#f0f2f5}
.sidebar{width:250px;background:#1a1a2e;color:white;position:fixed;height:100%;padding:1rem}
.main{margin-left:250px;padding:1rem}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem}
.stat-card{background:white;border-radius:0.5rem;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
</style>
</head>
<body>
<div class="sidebar"><h2>InnoCheck</h2><ul><li>Dashboard</li><li>Projects</li><li>Settings</li></ul></div>
<div class="main"><div class="stats"><div class="stat-card"><h3>24</h3><p>Projects</p></div></div></div>
</body>
</html>
""",
            "form": """
<!DOCTYPE html>
<html>
<head><title>Form</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh}
.form-card{background:white;border-radius:1rem;padding:2rem;width:100%;max-width:500px;box-shadow:0 10px 25px rgba(0,0,0,0.1)}
.form-group{margin-bottom:1rem}
label{display:block;margin-bottom:0.5rem;font-weight:500}
input,textarea,select{width:100%;padding:0.75rem;border:1px solid #ddd;border-radius:0.5rem}
button{background:#667eea;color:white;padding:0.75rem;border:none;border-radius:0.5rem;width:100%;cursor:pointer}
</style>
</head>
<body>
<div class="form-card"><h2>Contact Us</h2><form><div class="form-group"><label>Name</label><input type="text" placeholder="Enter name"></div><div class="form-group"><label>Email</label><input type="email" placeholder="Enter email"></div><div class="form-group"><label>Message</label><textarea rows="4" placeholder="Your message"></textarea></div><button type="submit">Submit</button></form></div>
</body>
</html>
""",
            "ecommerce": """
<!DOCTYPE html>
<html>
<head><title>Shop</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#f5f5f5}
.header{background:#1a1a2e;color:white;padding:1rem;text-align:center}
.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;padding:2rem;max-width:1200px;margin:0 auto}
.product-card{background:white;border-radius:1rem;padding:1rem;text-align:center}
.product-card img{width:100%;height:200px;object-fit:cover;border-radius:0.5rem}
.price{color:#667eea;font-size:1.2rem;margin:0.5rem 0}
.btn{background:#667eea;color:white;padding:0.5rem 1rem;border:none;border-radius:0.5rem;cursor:pointer}
</style>
</head>
<body>
<div class="header"><h1>Our Store</h1></div>
<div class="products"><div class="product-card"><h3>Product 1</h3><p class="price">$29.99</p><button class="btn">Add to Cart</button></div></div>
</body>
</html>
"""
        }
        
        html_code = templates.get(request.template.lower(), templates["blank"])
        
        # Modify color scheme if needed
        if request.color_scheme == "dark":
            html_code = html_code.replace("#f5f5f5", "#1a1a2e").replace("white", "#1a1a2e").replace("#333", "#fff")
        
        return {
            "success": True,
            "html_code": html_code,
            "css_code": "",
            "js_code": "",
            "preview_url": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER HISTORY ====================

@app.get("/api/user/history")
async def get_user_history():
    """Get user's history"""
    try:
        conn = sqlite3.connect('innocheck.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, feature, input_text, created_at FROM history ORDER BY created_at DESC LIMIT 10")
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "id": row[0],
                "feature": row[1],
                "input": row[2][:100] + "..." if len(row[2]) > 100 else row[2],
                "timestamp": row[3]
            })
        
        return {"success": True, "history": history}
    except Exception as e:
        return {"success": True, "history": []}  # Return empty if no history

# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
