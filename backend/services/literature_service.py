import logging
from typing import Dict, Any, List
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import faiss
    import numpy as np
    LITERATURE_DEPS_AVAILABLE = True
except (ImportError, OSError) as e:
    import logging
    logging.getLogger(__name__).warning(f"Failed to load literature dependencies: {e}")
    LITERATURE_DEPS_AVAILABLE = False

from backend.services.openai_service import openai_service

logger = logging.getLogger(__name__)

class LiteratureService:
    def __init__(self):
        self.model_name = 'all-MiniLM-L6-v2'
        self._model = None
        self.index = None
        self.papers = []

    @property
    def model(self):
        if not LITERATURE_DEPS_AVAILABLE:
            return None
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def calculate_relevance(self, query: str, abstract: str) -> int:
        """Calculate cosine similarity between query and abstract and return a percentage."""
        if not query or not abstract:
            return 0
        if not LITERATURE_DEPS_AVAILABLE:
            return 50 # Fallback relevance
        query_emb = self.model.encode([query])
        abs_emb = self.model.encode([abstract])
        sim = cosine_similarity(query_emb, abs_emb)[0][0]
        return int(max(0, min(100, sim * 100)))

    def summarize_paper(self, title: str, abstract: str) -> Dict[str, str]:
        """Generate a 5-Point Summary Card (Problem, Method, Dataset, Key Result, Limitation)"""
        prompt = f"""
        Analyze the following academic paper and provide a concise 5-Point Summary Card.
        Title: {title}
        Abstract: {abstract}
        
        Return ONLY a JSON object with the following keys, each containing a 1-2 sentence summary:
        - "Problem"
        - "Method"
        - "Dataset"
        - "Key Result"
        - "Limitation"
        """
        messages = [
            {"role": "system", "content": "You are an expert academic research assistant."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            import json
            response_text = openai_service._create_completion(messages, temperature=0.3, max_tokens=500)
            
            if response_text:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    data = json.loads(response_text[start_idx:end_idx])
                    return {
                        "Problem": data.get("Problem", "Not specified"),
                        "Method": data.get("Method", "Not specified"),
                        "Dataset": data.get("Dataset", "Not specified"),
                        "Key Result": data.get("Key Result", "Not specified"),
                        "Limitation": data.get("Limitation", "Not specified")
                    }
        except Exception as e:
            logger.error(f"Error summarizing paper: {e}")
            
        return {
            "Problem": "Failed to generate summary",
            "Method": "Failed to generate summary",
            "Dataset": "Failed to generate summary",
            "Key Result": "Failed to generate summary",
            "Limitation": "Failed to generate summary"
        }

    def index_papers(self, papers: List[Dict[str, Any]]):
        """Index papers in FAISS for fast retrieval."""
        if not papers:
            return
        self.papers = papers
        if not LITERATURE_DEPS_AVAILABLE:
            return
        texts = [p.get("abstract", "") for p in papers]
        embeddings = self.model.encode(texts)
        d = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(d)
        self.index.add(embeddings.astype('float32'))

    def generate_literature_survey(self, query: str, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a structured AI RAG literature survey report and hierarchy nodes for visualization."""
        if not query:
            return {"title": "Academic Search", "overview": "No query provided.", "insights": "", "tree_nodes": {}}
            
        papers_context = ""
        for p in papers[:5]:
            papers_context += f"- Title: {p.get('title')}\n  Authors: {p.get('authors')}\n  Year: {p.get('year')}\n  Abstract: {p.get('abstract') or p.get('summary')}\n\n"
            
        prompt = f"""
        Analyze the following academic papers related to the query "{query}" and generate a comprehensive Literature Survey.
        
        Papers Context:
        {papers_context}
        
        Provide the output in standard JSON format containing:
        1. "title": A prestigious, academic title for this survey.
        2. "overview": A 2-3 sentence overview of the current state of research.
        3. "insights": A synthesized academic literature survey report (2-3 detailed paragraphs) analyzing the methods, findings, and common trends.
        4. "tree_nodes": A hierarchical taxonomy structure (up to 3 levels: Root -> Sub-themes -> Individual Papers) to render a visual connection tree.
           The format for tree_nodes MUST be a single root object:
           {{
             "id": "root",
             "label": "[Main Research Core]",
             "children": [
               {{
                 "id": "sub_theme_1",
                 "label": "[Sub-theme category 1]",
                 "children": [
                   {{ "id": "paper_id_1", "label": "[Short paper title 1]" }}
                 ]
               }}
             ]
           }}
           
        Return ONLY valid JSON. Do not include markdown wraps or backticks.
        """
        
        messages = [
            {"role": "system", "content": "You are a senior distinguished academic research scientist and RAG architect."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            import json
            response_text = openai_service._create_completion(messages, temperature=0.3, max_tokens=1000)
            if response_text:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    data = json.loads(response_text[start_idx:end_idx])
                    return {
                        "title": data.get("title", f"Literature Survey: {query.title()}"),
                        "overview": data.get("overview", "Overview of the research landscape."),
                        "insights": data.get("insights", "Synthesized survey details."),
                        "tree_nodes": data.get("tree_nodes", {
                            "id": "root",
                            "label": query.title(),
                            "children": []
                        })
                    }
        except Exception as e:
            logger.error(f"Error generating literature survey: {e}")
            
        # Fallback response
        return {
            "title": f"Literature Survey: {query.title()}",
            "overview": "Synthesized academic review.",
            "insights": "Literature survey analysis covering active papers.",
            "tree_nodes": {
                "id": "root",
                "label": query.title(),
                "children": [
                    {
                        "id": "sub1",
                        "label": "Methodologies",
                        "children": [{"id": f"p{idx}", "label": p.get("title", "Paper")[:30] + "..."} for idx, p in enumerate(papers[:3])]
                    }
                ]
            }
        }

literature_service = LiteratureService()
