"""Service for fetching real project data from GitHub API."""

from __future__ import annotations

import json
import re
from typing import Any, List

import requests

from backend.database.models import Project


class GitHubService:
    """Service for fetching and parsing GitHub repositories."""
    
    BASE_URL = "https://api.github.com"
    
    def __init__(self, token: str = None):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'InnoCheck/1.0 (AI Project Validation Platform)',
            'Accept': 'application/vnd.github.v3+json'
        })
        
        # Add GitHub token if provided (for higher rate limits)
        if token:
            self.session.headers.update({'Authorization': f'token {token}'})
    
    def search_repositories(self, query: str, max_results: int = 10) -> List[dict[str, Any]]:
        """Search GitHub for repositories related to the query."""
        try:
            # Build search query - focus on repositories with good activity
            search_query = f'{query} stars:>10 pushed:>2023-01-01'
            
            params = {
                'q': search_query,
                'sort': 'stars',
                'order': 'desc',
                'per_page': min(max_results, 100)  # GitHub API limit
            }
            
            response = self.session.get(f"{self.BASE_URL}/search/repositories", params=params, timeout=10)
            response.raise_for_status()
            
            return self._parse_github_response(response.json())
            
        except requests.RequestException as e:
            print(f"GitHub API error: {e}")
            return []
        except Exception as e:
            print(f"Error parsing GitHub response: {e}")
            return []
    
    def _parse_github_response(self, response_data: dict[str, Any]) -> List[dict[str, Any]]:
        """Parse GitHub API response."""
        try:
            repositories = []
            
            for repo in response_data.get('items', []):
                try:
                    # Extract basic repository info
                    name = repo['name']
                    description = repo.get('description', '').strip()
                    full_name = repo['full_name']
                    html_url = repo['html_url']
                    
                    # Extract creation and update dates
                    created_at = repo['created_at']
                    updated_at = repo['updated_at']
                    year = int(created_at.split('-')[0]) if created_at else 2024
                    
                    # Extract language and domain mapping
                    language = repo.get('language', 'Unknown')
                    domain = self._map_language_to_domain(language)
                    
                    # Extract topics (tags)
                    topics = repo.get('topics', [])
                    
                    # Extract stats
                    stars = repo.get('stargazers_count', 0)
                    forks = repo.get('forks_count', 0)
                    
                    repository = {
                        'title': name,
                        'summary': description or f"A {language} project with {stars} stars",
                        'domain': domain,
                        'year': year,
                        'source': 'GitHub',
                        'url': html_url,
                        'known_gap': self._extract_gap_from_repo(repo),
                        'tech_stack': self._extract_tech_stack(repo, topics),
                        'stars': stars,
                        'forks': forks,
                        'language': language,
                        'topics': topics,
                        'last_updated': updated_at
                    }
                    
                    repositories.append(repository)
                    
                except Exception as e:
                    print(f"Error parsing individual repository: {e}")
                    continue
            
            return repositories
            
        except Exception as e:
            print(f"Error processing GitHub response: {e}")
            return []
    
    def _map_language_to_domain(self, language: str) -> str:
        """Map GitHub programming languages to domains."""
        language_map = {
            'Python': 'Machine Learning',
            'JavaScript': 'Web Development',
            'TypeScript': 'Web Development',
            'React': 'Web Development',
            'Vue': 'Web Development',
            'Angular': 'Web Development',
            'Node.js': 'Backend Development',
            'Java': 'Enterprise Software',
            'C++': 'Systems Programming',
            'C#': 'Enterprise Software',
            'Go': 'Cloud Infrastructure',
            'Rust': 'Systems Programming',
            'Swift': 'Mobile Development',
            'Kotlin': 'Mobile Development',
            'PHP': 'Web Development',
            'Ruby': 'Web Development',
            'Docker': 'DevOps',
            'Kubernetes': 'DevOps',
            'TensorFlow': 'Machine Learning',
            'PyTorch': 'Machine Learning'
        }
        
        return language_map.get(language, 'Software Development')
    
    def _extract_gap_from_repo(self, repo: dict[str, Any]) -> str:
        """Extract potential gaps from repository data."""
        # Look for indicators of limitations in the repository
        name = repo.get('name', '').lower()
        description = repo.get('description', '').lower()
        topics = [topic.lower() for topic in repo.get('topics', [])]
        
        # Common gap indicators
        gap_indicators = [
            'prototype', 'demo', 'poc', 'experimental', 'beta',
            'basic', 'simple', 'minimal', 'starter'
        ]
        
        for indicator in gap_indicators:
            if indicator in name or indicator in description:
                return f"Early-stage project with {repo.get('stargazers_count', 0)} stars. Needs production-ready features and comprehensive testing."
        
        # Check for limited documentation or testing
        if not description or len(description) < 50:
            return "Limited documentation and project description. Needs comprehensive readme and usage examples."
        
        # Check for low activity
        if repo.get('stargazers_count', 0) < 50:
            return "Limited community adoption and feedback. Could benefit from more user testing and feature validation."
        
        return "Opportunity for enhanced user experience features and broader use case coverage."
    
    def _extract_tech_stack(self, repo: dict[str, Any], topics: List[str]) -> List[str]:
        """Extract technology stack from repository."""
        tech_stack = []
        
        # Add primary language
        language = repo.get('language')
        if language:
            tech_stack.append(language)
        
        # Extract tech from topics
        tech_keywords = [
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask',
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy',
            'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'firebase',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
            'webpack', 'vite', 'babel', 'eslint', 'jest', 'cypress'
        ]
        
        for topic in topics:
            topic_lower = topic.lower()
            for tech in tech_keywords:
                if tech in topic_lower:
                    tech_stack.append(tech.title())
        
        # Remove duplicates and limit to 5 items
        return list(set(tech_stack))[:5]
    
    def save_repositories_to_db(self, db, repositories: List[dict[str, Any]]) -> int:
        """Save fetched repositories to database."""
        saved_count = 0
        
        for repo_data in repositories:
            try:
                # Check if repository already exists
                existing = db.query(Project).filter(
                    Project.url == repo_data['url'],
                    Project.source == 'GitHub'
                ).first()
                
                if existing:
                    continue
                
                # Create new project record
                project = Project(
                    title=repo_data['title'],
                    summary=repo_data['summary'],
                    domain=repo_data['domain'],
                    year=repo_data['year'],
                    source=repo_data['source'],
                    url=repo_data['url'],
                    known_gap=repo_data['known_gap'],
                    tech_stack=repo_data['tech_stack']
                )
                
                db.add(project)
                saved_count += 1
                
            except Exception as e:
                print(f"Error saving repository to database: {e}")
                continue
        
        if saved_count > 0:
            db.commit()
            print(f"Saved {saved_count} new GitHub repositories to database")
        
        return saved_count
    
    def fetch_and_save_repositories(self, db, query: str, max_results: int = 10) -> List[dict[str, Any]]:
        """Fetch repositories from GitHub and save them to database."""
        repositories = self.search_repositories(query, max_results)
        
        if repositories:
            saved_count = self.save_repositories_to_db(db, repositories)
            print(f"Fetched {len(repositories)} repositories, saved {saved_count} new ones")
        
        return repositories


# Global instance
github_service = GitHubService()
