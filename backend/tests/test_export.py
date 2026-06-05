import pytest
from fastapi.testclient import TestClient
from backend.app_simple import app

client = TestClient(app)

def test_export_comprehensive_markdown():
    """Test exporting comprehensive report in Markdown format (streaming response)"""
    response = client.post("/api/export/comprehensive/md")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/markdown; charset=utf-8"
    assert "attachment; filename=Project_Report.md" in response.headers["content-disposition"]
    
    # Verify report contents
    content = response.text
    assert "# InnoCheck Comprehensive Report" in content
    assert "📊 Project Originality & Uniqueness Analysis" in content
    assert "Uniqueness Score" in content
    assert "Success Metrics" in content

def test_export_comprehensive_pdf():
    """Test exporting comprehensive report in PDF format (mock PDF binary stream)"""
    response = client.post("/api/export/comprehensive/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=Project_Report.pdf" in response.headers["content-disposition"]
    
    # Verify PDF signature/content
    pdf_bytes = response.content
    assert pdf_bytes.startswith(b"%PDF")
    assert b"InnoCheck Tourist Safety Project Report" in pdf_bytes
    assert pdf_bytes.endswith(b"%%EOF")
