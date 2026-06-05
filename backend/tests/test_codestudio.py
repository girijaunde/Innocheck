import pytest
import base64
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

def test_codestudio_templates():
    """Test retrieving available frontend and hackathon stack templates"""
    response = client.get("/api/codestudio/templates")
    assert response.status_code == 200
    data = response.json()
    assert "templates" in data
    assert len(data["templates"]) >= 2
    
    # Confirm blank template and tourist_safety template are returned
    categories = [t["category"] for t in data["templates"]]
    assert "Frontend Frameworks" in categories
    assert "Advanced Hackathon Stacks" in categories

def test_codestudio_my_projects():
    """Test retrieving the list of user projects"""
    response = client.get("/api/codestudio/my-projects")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert len(data["projects"]) >= 1
    assert data["projects"][0]["id"] == 1
    assert "Tourist" in data["projects"][0]["title"]

def test_codestudio_preview_endpoint():
    """Test the GET preview endpoint for a project (HTML response)"""
    # Test valid project
    response = client.get("/api/codestudio/preview/1")
    assert response.status_code == 200
    assert "html" in response.headers["content-type"]
    assert "SafeTrek" in response.text

    # Test 404 for invalid project
    response = client.get("/api/codestudio/preview/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

def test_codestudio_suggest_stack():
    """Test stack suggestions based on description keywords"""
    # Test Tourist/SOS safety stack suggestion
    response = client.post(
        "/api/codestudio/suggest-stack",
        json={"description": "Build an SOS tracking tracker for trekking safety"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "LoRa" in data["primary_stack"]
    assert "zero-internet" in data["reason"].lower()
    assert data["estimated_time"] == "6-8 hours"

    # Test standard stack suggestion
    response = client.post(
        "/api/codestudio/suggest-stack",
        json={"description": "A classic e-commerce platform"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "React" in data["primary_stack"]
    assert data["estimated_time"] == "4-5 hours"

def test_codestudio_component_scaffold():
    """Test code scaffolding of specific react components"""
    response = client.post(
        "/api/codestudio/component",
        json={
            "description": "Provide a wearable SOS panic tracker dashboard Component",
            "framework": "React"
        }
    )
    assert response.status_code == 200
    assert "TouristSafetyTracker" in response.text

def test_codestudio_prototype_scaffold():
    """Test scaffolding complete mock HTML prototypes with light/dark configurations"""
    response = client.post(
        "/api/codestudio/prototype",
        json={
            "description": "Wearable emergency responder SOS layout",
            "color_scheme": "dark",
            "template_type": "dashboard"
        }
    )
    assert response.status_code == 200
    assert "html" in response.text
    assert "bg-slate-950" in response.text

def test_codestudio_explain_code():
    """Test AI code explanations breakdown"""
    response = client.post(
        "/api/codestudio/explain",
        json={
            "code": "const x = 5;",
            "framework": "React"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "State Orchestration" in data["explanation"]

def test_codestudio_chat_refine():
    """Test AI chat refinement logic (Marathi and dark mode overrides)"""
    # Dark Mode Refinement
    response = client.post(
        "/api/codestudio/chat-refine",
        json={
            "session_id": "test_sess_1",
            "code": "class='bg-slate-50 text-slate-800'",
            "instruction": "refine to dark mode color mappings",
            "framework": "HTML5",
            "code_type": "prototype"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "bg-slate-950" in data["code"]

    # Marathi Refinement
    response = client.post(
        "/api/codestudio/refine",
        json={
            "session_id": "test_sess_1",
            "code": "SafeTrek Guardian Live",
            "instruction": "add Marathi label",
            "framework": "HTML5",
            "code_type": "prototype"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "SafeTrek रक्षक लाइव" in data["code"]

def test_codestudio_test_code():
    """Test audit checks for DOM, state polling, and code complexity scores"""
    response = client.post(
        "/api/codestudio/test-code",
        json={
            "code": "const app = () => {}",
            "framework": "React"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["complexity_score"] >= 80
    assert len(data["warnings"]) >= 1

def test_codestudio_mock_data():
    """Test database mock schema generation"""
    response = client.post(
        "/api/codestudio/mock-data",
        json={"description": "incident wear logs telemetry database details"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 2
    assert data["data"][0]["table_name"] == "tourist_telemetry"

def test_codestudio_pitch_deck():
    """Test presentation deck builder generation"""
    response = client.post(
        "/api/codestudio/pitch-deck",
        json={
            "description": "wearable tourist mesh tracker",
            "code": "const App = () => {}"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "SafeTrek Guardian AI" in data["markdown"]

def test_codestudio_plagiarism_check():
    """Test lightweight semantic originality audits"""
    response = client.post(
        "/api/codestudio/plagiarism-check",
        json={"code": "const check = () => {}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["unique_percentage"] == 78
    assert "78% Match Rating" in data["status_text"]

def test_codestudio_export_platform():
    """Test base64 ZIP compiler generation"""
    response = client.post(
        "/api/codestudio/export-platform",
        json={
            "description": "Tourist emergency system",
            "platform": "Web",
            "framework": "React",
            "code": "const App = () => {}",
            "code_type": "prototype"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "zip_base64" in data
    
    # Confirm base64 is decodable
    decoded_bytes = base64.b64decode(data["zip_base64"])
    assert len(decoded_bytes) > 0
    assert "Download ZIP Package" in data["instructions"]

def test_codestudio_save_and_fork_project():
    """Test saving a new custom template project and forking it"""
    # 1. Save Project
    response = client.post(
        "/api/codestudio/save-project",
        json={
            "title": "My Awesome Custom Project",
            "description": "Beautiful custom dashboard layout builder",
            "framework": "React",
            "code": "const Layout = () => {}",
            "tags": ["Custom", "Visual"],
            "is_public": True
        }
    )
    assert response.status_code == 200
    save_data = response.json()
    assert save_data["success"] is True
    new_id = save_data["project"]["id"]

    # 2. Fork Project
    fork_response = client.post(f"/api/codestudio/fork-project/{new_id}")
    assert fork_response.status_code == 200
    fork_data = fork_response.json()
    assert fork_data["success"] is True
    assert "Fork: My Awesome Custom Project" in fork_data["project"]["title"]
