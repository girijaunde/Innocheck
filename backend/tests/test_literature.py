import pytest
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

def get_auth_headers(token="mock_access_token_123456789"):
    return {"Authorization": f"Bearer {token}"}

def test_search_literature_unauthorized():
    """Missing or invalid token should return 401 Unauthorized for search"""
    response = client.post(
        "/api/literature/search",
        json={"query": "RAG", "year_from": 2020, "year_to": 2026}
    )
    assert response.status_code == 401

def test_search_literature_authorized():
    """Authorized search with filters should return filtered list of papers under 5-10s"""
    response = client.post(
        "/api/literature/search",
        json={"query": "RAG", "year_from": 2020, "year_to": 2026},
        headers=get_auth_headers()
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "papers" in data
    assert data["total"] >= 1
    
    # Verify paper contains the RAG abstract or title
    titles = [p["title"] for p in data["papers"]]
    assert any("RAG" in t or "Retrieval-Augmented" in t for t in titles)

def test_save_paper_and_bibliography_lifecycle():
    """Test full saving, listing, bibliography exporting, and deletion lifecycle"""
    # 1. Save a paper
    response = client.post(
        "/api/literature/save",
        json={
            "title": "Smart Wearables for Wilderness Telemetry Mesh Tracking",
            "authors": "Singh, A., Kumar, R.",
            "year": 2024,
            "doi": "10.1109/WTM.2024.12",
            "url": "https://example.com/wtm"
        }
    )
    assert response.status_code == 200
    save_data = response.json()
    assert save_data["success"] is True
    assert save_data["paper"]["id"] is not None
    paper_id = save_data["paper"]["id"]

    # 2. Get saved papers
    list_response = client.get("/api/literature/saved")
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["success"] is True
    assert list_data["count"] >= 1
    assert any(p["id"] == paper_id for p in list_data["papers"])

    # 3. Export bibliography
    bib_response = client.get("/api/literature/bibliography")
    assert bib_response.status_code == 200
    bib_data = bib_response.json()
    assert bib_data["success"] is True
    assert bib_data["count"] >= 1
    assert "Singh, A." in bib_data["bibliography"]
    assert "Wilderness Telemetry Mesh Tracking" in bib_data["bibliography"]

    # 4. Delete the saved paper
    del_response = client.delete(f"/api/literature/saved/{paper_id}")
    assert del_response.status_code == 200
    del_data = del_response.json()
    assert del_data["success"] is True
    assert del_data["message"] == "Paper deleted successfully"

    # 5. Verify it's deleted
    final_response = client.get("/api/literature/saved")
    assert final_response.status_code == 200
    final_data = final_response.json()
    assert not any(p["id"] == paper_id for p in final_data["papers"])
