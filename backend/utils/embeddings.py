from __future__ import annotations

from functools import lru_cache
from typing import Iterable, List

import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


MODEL_NAME = "intfloat/multilingual-e5-large"


@lru_cache(maxsize=1)
def get_embedder():
    if SentenceTransformer is None:
        return None
    try:
        return SentenceTransformer(MODEL_NAME)
    except Exception:
        return None


def _fallback_embed(text: str, dims: int = 384) -> np.ndarray:
    vec = np.zeros(dims, dtype=np.float32)
    for i, ch in enumerate(text.encode("utf-8")):
        vec[i % dims] += float(ch) / 255.0
    norm = np.linalg.norm(vec) + 1e-8
    return vec / norm


def embed_texts(texts: Iterable[str]) -> np.ndarray:
    text_list: List[str] = [f"query: {t.strip()}" for t in texts]
    model = get_embedder()
    if model is None:
        return np.stack([_fallback_embed(t) for t in text_list])
    embeddings = model.encode(text_list, normalize_embeddings=True)
    return np.asarray(embeddings, dtype=np.float32)

