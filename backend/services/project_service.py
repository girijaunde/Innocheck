"""Service for managing real-world projects from APIs and database."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, List

from sqlalchemy.orm import Session

from backend.database.models import Project
from backend.services.arxiv_service import arxiv_service
from backend.services.github_service import github_service
from backend.services.semantic_search_service import get_semantic_search_service


class ProjectService:
    def __init__(self):
        self.sample_data_path = Path(__file__).resolve().parents[2] / "data" / "sample_projects.json"
        
    def load_sample_data(self, db: Session) -> None:
        """Load sample projects into database if empty."""
        existing_count = db.query(Project).count()
        if existing_count > 0:
            return
            
        try:
            with open(self.sample_data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            for item in data["items"]:
                project = Project(
                    title=item["title"],
                    summary=item["summary"],
                    domain=item["domain"],
                    year=item.get("year"),
                    source=item["source"],
                    url=item["url"],
                    known_gap=item.get("known_gap"),
                    tech_stack=item.get("tech_stack", []),
                    similarity_keywords=self._extract_keywords(item["title"] + " " + item["summary"])
                )
                db.add(project)
                
            db.commit()
            print(f"Loaded {len(data['items'])} sample projects into database")
            
        except FileNotFoundError:
            print("Sample projects file not found")
        except Exception as e:
            print(f"Error loading sample data: {e}")
    
    def fetch_real_world_data(self, db: Session, query: str, keywords: list[str] | None = None, force_refresh: bool = False) -> bool:
        """Fetch real-world data from APIs using extracted keywords with fallback to sample data."""
        search_query = " ".join([kw for kw in keywords if kw]) if keywords else query
        if not search_query.strip():
            search_query = query

        success = False

        try:
            papers = arxiv_service.fetch_and_save_papers(db, search_query, max_results=15)
            if not papers and keywords:
                papers = arxiv_service.fetch_and_save_papers(db, query, max_results=15)
            if papers:
                success = True
        except Exception as e:
            print(f"Error fetching arXiv data: {e}")

        try:
            repos = github_service.fetch_and_save_repositories(db, search_query, max_results=15)
            if repos:
                success = True
        except Exception as e:
            print(f"Error fetching GitHub data: {e}")

        if success or force_refresh:
            return True

        self.load_sample_data(db)
        return False
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords for similarity matching."""
        # Simple keyword extraction - can be enhanced with NLP
        words = text.lower().split()
        # Filter out common words and short words
        keywords = [word for word in words if len(word) > 3 and word.isalpha()]
        return list(set(keywords[:10]))  # Return top 10 unique keywords
    
    def search_projects(self, db: Session, query: str, top_k: int = 5, domain_filter: str = None, keywords: list[str] | None = None) -> List[dict[str, Any]]:
        """Search projects using semantic similarity ranking."""
        if not query or not query.strip():
            return []

        # Query database for active projects with optional domain filter
        projects_query = db.query(Project).filter(Project.is_active == True)
        if domain_filter:
            projects_query = projects_query.filter(Project.domain.ilike(f"%{domain_filter}%"))

        projects = projects_query.all()
        if not projects:
            return []

        # Build candidate list for semantic search
        candidates = []
        project_map = {}
        
        for project in projects:
            candidate_id = len(candidates)
            candidates.append({
                "id": candidate_id,
                "text": f"{project.title} {project.summary} {project.domain}",
                "project": project
            })
            project_map[candidate_id] = project

        # Perform semantic search
        semantic_service = get_semantic_search_service()
        ranked_results = semantic_service.semantic_search(
            query=query,
            candidates=candidates,
            candidate_text_field="text",
            top_k=min(top_k, len(candidates))
        )

        # Convert results to API format with normalized similarity scores
        results = []
        for ranked in ranked_results:
            project = project_map[ranked["id"]]
            # Normalize cosine similarity (0-1) to 20-95 range for API consistency
            normalized_similarity = int(20 + ranked["similarity_score"] * 75)
            
            results.append({
                "title": project.title,
                "summary": project.summary,
                "domain": project.domain,
                "year": project.year,
                "source": project.source,
                "url": project.url,
                "known_gap": project.known_gap,
                "tech_stack": project.tech_stack or [],
                "similarity": normalized_similarity
            })

        return results
    
    def get_project_by_id(self, db: Session, project_id: int) -> Project | None:
        """Get a specific project by ID."""
        return db.query(Project).filter(Project.id == project_id, Project.is_active == True).first()
    
    def get_projects_by_domain(self, db: Session, domain: str, limit: int = 10) -> List[Project]:
        """Get projects by domain."""
        return db.query(Project).filter(
            Project.domain.ilike(f"%{domain}%"),
            Project.is_active == True
        ).limit(limit).all()
    
    def add_project(self, db: Session, project_data: dict[str, Any]) -> Project:
        """Add a new project to the database."""
        project = Project(
            title=project_data["title"],
            summary=project_data["summary"],
            domain=project_data["domain"],
            year=project_data.get("year"),
            source=project_data.get("source", "User Submitted"),
            url=project_data.get("url"),
            known_gap=project_data.get("known_gap"),
            tech_stack=project_data.get("tech_stack", []),
            similarity_keywords=self._extract_keywords(project_data["title"] + " " + project_data["summary"])
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project


# Global instance
project_service = ProjectService()
