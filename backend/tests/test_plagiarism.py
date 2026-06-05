import pytest
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

def get_auth_headers(token="mock_access_token_123456789"):
    return {"Authorization": f"Bearer {token}"}

def test_plagiarism_unauthorized():
    """Missing or invalid token should return 401 Unauthorized for plagiarism check"""
    response = client.post(
        "/api/plagiarism/check",
        json={"text": "This is sample text to check for plagiarism in a mock hackathon context."}
    )
    assert response.status_code == 401

def test_plagiarism_authorized():
    """Authorized plagiarism request with default sources should return 200 OK and detailed report"""
    text_content = "This is sample text to check for plagiarism. Let us write a few more words to cross the ten words limit for highlighting."
    response = client.post(
        "/api/plagiarism/check",
        json={
            "text": text_content,
            "sources": ["devpost", "github"]
        },
        headers=get_auth_headers()
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "plagiarism_percentage" in data
    assert "unique_percentage" in data
    assert "status" in data
    assert "status_text" in data
    assert "status_color" in data
    assert "matched_sources" in data
    assert "highlighted_text" in data
    assert data["word_count"] == len(text_content.split())

    # Verify matching sources filters correctly
    sources = [s["source"].lower() for s in data["matched_sources"]]
    assert "devpost" in sources
    assert "github" in sources
    assert "arxiv" not in sources

def test_plagiarism_all_sources():
    """Test plagiarism check with all sources"""
    response = client.post(
        "/api/plagiarism/check",
        json={
            "text": "Short text",
            "sources": ["arxiv"]
        },
        headers=get_auth_headers()
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["matched_sources"]) == 1
    assert data["matched_sources"][0]["source"] == "arXiv"
