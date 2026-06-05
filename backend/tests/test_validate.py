import pytest
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

# Helper function for authenticated headers
def get_auth_headers(token="mock_access_token_123456789"):
    return {"Authorization": f"Bearer {token}"}

def test_unauthorized_missing_token():
    """Missing token should return 401 Unauthorized"""
    response = client.post(
        "/api/validate",
        json={"problem_statement": "Build a tourist safety system for Northeast India using AI"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_unauthorized_invalid_token():
    """Invalid token should return 401 Unauthorized"""
    response = client.post(
        "/api/validate",
        json={"problem_statement": "Build a tourist safety system for Northeast India using AI"},
        headers=get_auth_headers("wrong_token_value")
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"

def test_empty_problem_statement():
    """Empty problem statement should return 400 Bad Request"""
    # Empty string
    response = client.post(
        "/api/validate",
        json={"problem_statement": "", "language": "en"},
        headers=get_auth_headers()
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "problem_statement cannot be empty"

    # Only whitespace
    response = client.post(
        "/api/validate",
        json={"problem_statement": "   ", "language": "en"},
        headers=get_auth_headers()
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "problem_statement cannot be empty"

def test_invalid_language():
    """Unsupported language code should return 400 Bad Request"""
    response = client.post(
        "/api/validate",
        json={
            "problem_statement": "Build a tourist safety system for Northeast India using AI",
            "language": "fr" # French is unsupported
        },
        headers=get_auth_headers()
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported language code"

def test_valid_english_input():
    """English input test should return 200 OK and structured JSON analysis"""
    response = client.post(
        "/api/validate",
        json={
            "problem_statement": "Build a tourist safety system for Northeast India using AI",
            "language": "en"
        },
        headers=get_auth_headers()
    )
    assert response.status_code == 200
    data = response.json()
    assert "uniqueness_score" in data
    assert "score_label" in data
    assert "score_description" in data
    assert "innovation_gaps" in data
    assert "similar_papers" in data
    assert "improvement_suggestions" in data
    assert "potential_challenges" in data
    assert "success_metrics" in data

    # Let's verify details matches our context-specific heuristics
    assert any(word in data["score_description"].lower() for word in ["wearable", "telemetry", "safety", "tourist"])
    assert len(data["innovation_gaps"]) >= 2
    assert data["similar_papers"][0]["source"] == "IEEE Source"

def test_valid_marathi_input():
    """Marathi input test should return 200 OK and Marathi response, no crash"""
    response = client.post(
        "/api/validate",
        json={
            "problem_statement": "उत्तर-पूर्व भारतातील पर्यटकांच्या सुरक्षिततेसाठी AI प्रणाली तयार करा",
            "language": "mr"
        },
        headers=get_auth_headers()
    )
    assert response.status_code == 200
    data = response.json()
    assert "uniqueness_score" in data
    assert "score_label" in data
    assert "score_description" in data
    
    # Confirm it translates to Marathi keywords
    assert "अद्वितीय" in data["score_label"]
    assert "दुर्गम" in data["score_description"] or "स्थानिक" in data["score_description"]
