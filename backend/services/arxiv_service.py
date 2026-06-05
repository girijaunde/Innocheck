"""Service for fetching real project data from arXiv API."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any, List
from urllib.parse import quote

import requests

from backend.database.models import Project
from backend.services.openai_service import openai_service


class ArxivService:
    """Service for fetching and parsing arXiv papers."""
    
    BASE_URL = "http://export.arxiv.org/api/query"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'InnoCheck/1.0 (AI Project Validation Platform)'
        })
    
    def search_papers(self, query: str, max_results: int = 10) -> List[dict[str, Any]]:
        """Search arXiv for papers related to the query."""
        try:
            search_query = f'all:"{query}" AND (cat:"cs.*" OR cat:"stat.ML" OR cat:"AI")'
            params = {
                'search_query': search_query,
                'start': 0,
                'max_results': max_results,
                'sortBy': 'relevance',
                'sortOrder': 'descending'
            }
            response = self.session.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            return self._parse_arxiv_response(response.text)

        except requests.RequestException as e:
            print(f"arXiv API error: {e}")
            return []
        except Exception as e:
            print(f"Error parsing arXiv response: {e}")
            return []

    def fetch_papers_by_keywords(self, keywords: list[str], max_results: int = 10, min_results: int = 3) -> List[dict[str, Any]]:
        """Search arXiv using extracted keywords and broaden the query if needed."""
        query_terms = [term for term in keywords if term]
        if not query_terms:
            return []

        query = " ".join(query_terms)
        papers = self.search_papers(query, max_results=max_results)
        if len(papers) >= min_results:
            return papers[:max_results]

        # Broaden search by using subsets of keywords
        for count in range(len(query_terms) - 1, 0, -1):
            broadened_query = " ".join(query_terms[:count])
            papers = self.search_papers(broadened_query, max_results=max_results)
            if len(papers) >= min_results:
                return papers[:max_results]

        return papers[:max_results]
    
    def search_arxiv(self, query: str, max_results: int = 5) -> List[dict[str, str]]:
        """Search arXiv by query using extracted keywords and return simplified results."""
        search_keywords = openai_service.extract_keywords(query)
        if not search_keywords:
            search_keywords = [word for word in query.lower().split() if len(word) > 3][:6]

        papers = self.fetch_papers_by_keywords(search_keywords, max_results=max_results, min_results=3)
        results: list[dict[str, str]] = []
        for paper in papers[:max_results]:
            results.append({
                "title": paper.get("title", "Unknown"),
                "summary": paper.get("summary", ""),
                "url": paper.get("url", ""),
                "year": paper.get("year", 2024),
                "source": paper.get("source", "arXiv"),
                "authors": paper.get("authors", []),
            })
        return results

    def _parse_arxiv_response(self, xml_content: str) -> List[dict[str, Any]]:
        """Parse arXiv XML response."""
        try:
            root = ET.fromstring(xml_content)
            papers = []
            
            # Define XML namespaces
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom',
                'arxiv': 'http://arxiv.org/schemas/atom'
            }
            
            for entry in root.findall('atom:entry', namespaces):
                try:
                    # Extract basic info safely
                    title_elem = entry.find('atom:title', namespaces)
                    summary_elem = entry.find('atom:summary', namespaces)
                    id_elem = entry.find('atom:id', namespaces)
                    published_elem = entry.find('atom:published', namespaces)

                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else 'Untitled'
                    summary = summary_elem.text.strip() if summary_elem is not None and summary_elem.text else ''
                    arxiv_id = id_elem.text.strip() if id_elem is not None and id_elem.text else ''
                    url = arxiv_id if arxiv_id.startswith('http') else f'https://arxiv.org/abs/{arxiv_id}' if arxiv_id else 'https://arxiv.org'
                    year = 2024
                    if published_elem is not None and published_elem.text:
                        try:
                            year = int(published_elem.text.split('-')[0])
                        except ValueError:
                            year = 2024
                    
                    # Extract categories (domains)
                    categories = []
                    for category in entry.findall('arxiv:primary_category', namespaces):
                        cat = category.get('term', '')
                        if cat.startswith('cs.'):
                            categories.append(self._map_cs_category(cat[3:]))
                        elif cat == 'stat.ML':
                            categories.append('Machine Learning')
                        elif cat == 'AI':
                            categories.append('Artificial Intelligence')

                    if not categories:
                        for category in entry.findall('atom:category', namespaces):
                            cat = category.get('term', '')
                            if cat.startswith('cs.'):
                                categories.append(self._map_cs_category(cat[3:]))
                            elif cat == 'stat.ML':
                                categories.append('Machine Learning')
                            elif cat == 'AI':
                                categories.append('Artificial Intelligence')

                    domain = categories[0] if categories else 'Computer Science'
                    
                    # Extract authors safely
                    authors = []
                    for author in entry.findall('atom:author', namespaces):
                        name_elem = author.find('atom:name', namespaces)
                        name = name_elem.text.strip() if name_elem is not None and name_elem.text else 'Unknown'
                        authors.append(name)
                    if not authors:
                        authors = ['Unknown']
                    
                    paper = {
                        'title': title,
                        'summary': summary,
                        'domain': domain,
                        'year': year,
                        'source': 'arXiv',
                        'url': url,
                        'known_gap': self._extract_gap_from_summary(summary),
                        'tech_stack': self._extract_tech_stack(summary),
                        'authors': authors,
                        'categories': categories
                    }
                    
                    papers.append(paper)
                    
                except Exception as e:
                    print(f"Error parsing individual paper: {e}")
                    continue
            
            return papers
            
        except ET.ParseError as e:
            print(f"XML parsing error: {e}")
            return []
    
    def _map_cs_category(self, cs_category: str) -> str:
        """Map arXiv CS categories to readable domains."""
        category_map = {
            'AI': 'Artificial Intelligence',
            'CV': 'Computer Vision',
            'CL': 'Computational Linguistics',
            'LG': 'Machine Learning',
            'NE': 'Neural and Evolutionary Computing',
            'RO': 'Robotics',
            'HC': 'Human-Computer Interaction',
            'IR': 'Information Retrieval',
            'DB': 'Databases',
            'SE': 'Software Engineering',
            'PL': 'Programming Languages',
            'CR': 'Cryptography and Security',
            'GR': 'Graphics',
            'SI': 'Social and Information Networks'
        }
        return category_map.get(cs_category, 'Computer Science')
    
    def _extract_gap_from_summary(self, summary: str) -> str:
        """Extract potential gaps from paper summary."""
        # Look for common gap indicators
        gap_indicators = [
            'limitation', 'challenge', 'problem', 'issue', 'constraint',
            'future work', 'improvement', 'extension', 'drawback'
        ]
        
        summary_lower = summary.lower()
        for indicator in gap_indicators:
            if indicator in summary_lower:
                # Extract sentence containing the indicator
                sentences = summary.split('.')
                for sentence in sentences:
                    if indicator in sentence.lower():
                        return sentence.strip()[:200] + '...' if len(sentence) > 200 else sentence.strip()
        
        return "Limited real-world validation and deployment scenarios."
    
    def _extract_tech_stack(self, summary: str) -> List[str]:
        """Extract technology stack from summary."""
        # Common technologies in AI/ML papers
        tech_keywords = [
            'python', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
            'react', 'vue', 'angular', 'node.js', 'flask', 'django',
            'docker', 'kubernetes', 'aws', 'gcp', 'azure',
            'mongodb', 'postgresql', 'mysql', 'redis',
            'opencv', 'numpy', 'pandas', 'matplotlib'
        ]
        
        summary_lower = summary.lower()
        found_techs = []
        
        for tech in tech_keywords:
            if tech in summary_lower:
                found_techs.append(tech.title())
        
        return found_techs[:5]  # Return top 5 technologies
    
    def save_papers_to_db(self, db, papers: List[dict[str, Any]]) -> int:
        """Save fetched papers to database."""
        saved_count = 0
        
        for paper_data in papers:
            try:
                # Check if paper already exists
                existing = db.query(Project).filter(
                    Project.url == paper_data['url'],
                    Project.source == 'arXiv'
                ).first()
                
                if existing:
                    continue
                
                # Create new project record
                project = Project(
                    title=paper_data['title'],
                    summary=paper_data['summary'],
                    domain=paper_data['domain'],
                    year=paper_data['year'],
                    source=paper_data['source'],
                    url=paper_data['url'],
                    known_gap=paper_data['known_gap'],
                    tech_stack=paper_data['tech_stack']
                )
                
                db.add(project)
                saved_count += 1
                
            except Exception as e:
                print(f"Error saving paper to database: {e}")
                continue
        
        if saved_count > 0:
            db.commit()
            print(f"Saved {saved_count} new arXiv papers to database")
        
        return saved_count
    
    def fetch_and_save_papers(self, db, query: str, max_results: int = 10) -> List[dict[str, Any]]:
        """Fetch papers from arXiv and save them to database."""
        papers = self.search_papers(query, max_results)
        
        if papers:
            saved_count = self.save_papers_to_db(db, papers)
            print(f"Fetched {len(papers)} papers, saved {saved_count} new ones")
        
        return papers


# Global instance
arxiv_service = ArxivService()


def search_arxiv(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Search arXiv using extracted keywords and return title, summary, and url."""
    return arxiv_service.search_arxiv(query=query, max_results=max_results)

