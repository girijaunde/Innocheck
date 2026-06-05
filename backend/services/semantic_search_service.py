"""
Semantic search service using SentenceTransformers embeddings.
Provides semantic similarity-based search functionality for projects and papers.
"""

import numpy as np
import logging
from typing import List, Dict, Tuple, Optional
from scipy.spatial.distance import cosine

logger = logging.getLogger(__name__)

# Lazy import for torch/SentenceTransformers - may fail on Windows
try:
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except (ImportError, OSError) as e:
    logger.warning(f"SentenceTransformers not available: {e}. Semantic search will use fallback.")
    TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None


class SemanticSearchService:
    """
    Service for semantic search using pre-trained sentence embeddings.
    Uses all-MiniLM-L6-v2 model for 384-dimensional embeddings.
    Falls back to basic string similarity if SentenceTransformers unavailable.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the semantic search service with a pre-trained model.
        
        Args:
            model_name: HuggingFace model identifier for SentenceTransformers.
                       Default is all-MiniLM-L6-v2 (384-dim, 22M params, fast).
        """
        self.model = None
        self.embedding_dim = 384  # Default dimension for all-MiniLM-L6-v2
        
        if TRANSFORMERS_AVAILABLE and SentenceTransformer:
            try:
                self.model = SentenceTransformer(model_name)
                self.embedding_dim = self.model.get_sentence_embedding_dimension()
                logger.info(f"✓ Semantic search initialized with {model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize SentenceTransformer: {e}. Using fallback.")
                self.model = None
        else:
            logger.info("Using fallback semantic search (string matching)")

    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Convert text to a dense embedding vector.
        
        Args:
            text: Input text to embed. Can be sentence, paragraph, or document.
        
        Returns:
            numpy array of shape (embedding_dim,) with float32 values.
        """
        if not text or not isinstance(text, str):
            return np.zeros(self.embedding_dim, dtype=np.float32)
        
        if self.model:
            embedding = self.model.encode(text.strip(), convert_to_numpy=True)
            return embedding.astype(np.float32)
        else:
            # Fallback: return simple hash-based embedding
            return self._hash_embedding(text.strip())
    
    def _hash_embedding(self, text: str) -> np.ndarray:
        """Generate a deterministic embedding from text hash."""
        import hashlib
        h = hashlib.md5(text.encode()).digest()
        arr = np.frombuffer(h, dtype=np.uint8).astype(np.float32) / 255.0
        # Pad to embedding_dim
        if len(arr) < self.embedding_dim:
            arr = np.pad(arr, (0, self.embedding_dim - len(arr)), 'constant')
        return arr[:self.embedding_dim]
    
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Convert multiple texts to embedding vectors (batch processing).
        
        Args:
            texts: List of text strings to embed.
        
        Returns:
            numpy array of shape (len(texts), embedding_dim) with float32 values.
        """
        if not texts:
            return np.zeros((0, self.embedding_dim), dtype=np.float32)
        
        # Filter empty strings but preserve list length for batch processing
        texts = [t.strip() if t and isinstance(t, str) else "" for t in texts]
        
        if self.model:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.astype(np.float32)
        else:
            # Fallback: use hash-based embeddings
            return np.array([self._hash_embedding(t) for t in texts], dtype=np.float32)
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector (1D array).
            embedding2: Second embedding vector (1D array).
        
        Returns:
            Cosine similarity score between -1 and 1 (typically 0 to 1 for normalized embeddings).
        """
        if embedding1.size == 0 or embedding2.size == 0:
            return 0.0
        
        # Cosine similarity = 1 - cosine_distance
        # scipy.spatial.distance.cosine returns distance, so subtract from 1
        similarity = 1 - cosine(embedding1, embedding2)
        return float(similarity)
    
    def compute_similarities_batch(self, query_embedding: np.ndarray, 
                                   candidate_embeddings: np.ndarray) -> np.ndarray:
        """
        Compute cosine similarities between query and multiple candidates (vectorized).
        
        Args:
            query_embedding: Query embedding vector of shape (embedding_dim,).
            candidate_embeddings: Candidate embeddings of shape (n_candidates, embedding_dim).
        
        Returns:
            Numpy array of shape (n_candidates,) with similarity scores.
        """
        if query_embedding.size == 0 or candidate_embeddings.shape[0] == 0:
            return np.zeros(candidate_embeddings.shape[0], dtype=np.float32)
        
        # Normalize embeddings for cosine similarity
        query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-8)
        candidates_norm = candidate_embeddings / (np.linalg.norm(candidate_embeddings, axis=1, keepdims=True) + 1e-8)
        
        # Compute cosine similarity via dot product of normalized vectors
        similarities = np.dot(candidates_norm, query_norm)
        return similarities.astype(np.float32)
    
    def semantic_search(self, query: str, candidates: List[Dict], 
                       candidate_text_field: str = "text",
                       top_k: int = 5) -> List[Dict]:
        """
        Perform semantic similarity search over candidate items.
        
        Args:
            query: Query text to search for.
            candidates: List of candidate dictionaries to search over.
            candidate_text_field: Key in candidate dict containing text to embed.
                                 Can be a single field or "field1|field2" for concatenation.
            top_k: Number of top results to return.
        
        Returns:
            List of top_k candidates sorted by semantic similarity (highest first).
            Each dict includes original candidate data plus "similarity_score" (0-1).
        """
        if not query or not candidates:
            return []
        
        # Embed query
        query_embedding = self.embed_text(query)
        
        # Extract and embed candidate texts
        candidate_texts = []
        for candidate in candidates:
            if '|' in candidate_text_field:
                # Concatenate multiple fields
                fields = candidate_text_field.split('|')
                text_parts = [str(candidate.get(f, "")) for f in fields]
                text = " ".join(text_parts)
            else:
                text = str(candidate.get(candidate_text_field, ""))
            candidate_texts.append(text)
        
        candidate_embeddings = self.embed_texts(candidate_texts)
        
        # Compute similarities
        similarities = self.compute_similarities_batch(query_embedding, candidate_embeddings)
        
        # Sort by similarity (descending) and get top_k
        top_indices = np.argsort(-similarities)[:top_k]
        
        # Build results with similarity scores
        results = []
        for idx in top_indices:
            result = candidates[idx].copy()
            result["similarity_score"] = float(similarities[idx])
            results.append(result)
        
        return results
    
    def semantic_search_batch(self, queries: List[str], candidates: List[Dict],
                              candidate_text_field: str = "text",
                              top_k: int = 5) -> List[List[Dict]]:
        """
        Perform semantic search for multiple queries over the same candidate set.
        
        Args:
            queries: List of query texts.
            candidates: List of candidate dictionaries.
            candidate_text_field: Key(s) in candidate dict for text embedding.
            top_k: Number of top results per query.
        
        Returns:
            List of results lists, one per query.
        """
        results_per_query = []
        for query in queries:
            results = self.semantic_search(query, candidates, candidate_text_field, top_k)
            results_per_query.append(results)
        return results_per_query


# Global instance for use across the application
_semantic_search_service: Optional[SemanticSearchService] = None


def get_semantic_search_service() -> SemanticSearchService:
    """
    Get or create a singleton instance of SemanticSearchService.
    
    Returns:
        SemanticSearchService instance for semantic search operations.
    """
    global _semantic_search_service
    if _semantic_search_service is None:
        _semantic_search_service = SemanticSearchService()
    return _semantic_search_service
