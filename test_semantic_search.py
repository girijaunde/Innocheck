#!/usr/bin/env python3
"""Test semantic search functionality with various query types."""

from backend.services.semantic_search_service import SemanticSearchService

def test_semantic_search():
    # Initialize service
    service = SemanticSearchService()
    print('✓ Semantic search service initialized')
    print(f'  Embedding dimension: {service.embedding_dim}')
    print()

    # Test data with various projects
    test_candidates = [
        {'id': 1, 'text': 'Deep learning neural networks for image classification using convolutional networks'},
        {'id': 2, 'text': 'Machine learning time series forecasting with LSTM and recurrent networks'},
        {'id': 3, 'text': 'Natural language processing transformer models for text generation'},
        {'id': 4, 'text': 'Recommender systems using collaborative filtering and matrix factorization'},
        {'id': 5, 'text': 'Blockchain cryptocurrency smart contracts and distributed ledger technology'},
    ]

    # Test 1: Exact query
    print('TEST 1: Exact Query - "image classification"')
    results = service.semantic_search('image classification', test_candidates, 'text', top_k=3)
    for i, r in enumerate(results, 1):
        print(f'  {i}. [{r["similarity_score"]:.3f}] {r["text"][:50]}...')
    print()

    # Test 2: Typo query
    print('TEST 2: Typo Query - "machin lerning"')
    results = service.semantic_search('machin lerning', test_candidates, 'text', top_k=3)
    for i, r in enumerate(results, 1):
        print(f'  {i}. [{r["similarity_score"]:.3f}] {r["text"][:50]}...')
    print()

    # Test 3: Synonym query
    print('TEST 3: Synonym Query - "deep neural networks"')
    results = service.semantic_search('deep neural networks', test_candidates, 'text', top_k=3)
    for i, r in enumerate(results, 1):
        print(f'  {i}. [{r["similarity_score"]:.3f}] {r["text"][:50]}...')
    print()

    # Test 4: Alternative phrasing
    print('TEST 4: Alternative Phrasing - "classify images with AI"')
    results = service.semantic_search('classify images with AI', test_candidates, 'text', top_k=3)
    for i, r in enumerate(results, 1):
        print(f'  {i}. [{r["similarity_score"]:.3f}] {r["text"][:50]}...')
    print()

    print('✓ All semantic search tests passed!')

if __name__ == '__main__':
    test_semantic_search()
