import pytest
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root GET / endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "InnoCheck API"
    assert data["version"] == "1.0.0"
    assert "/api/health" in data["endpoints"]

def test_health_check_endpoint():
    """Test the GET /api/health endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "InnoCheck API is running" in data["message"]
    assert "timestamp" in data
