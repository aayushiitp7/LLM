import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "version": "0.1.0", "environment": "development"}

def test_unauthorized_access():
    response = client.get("/api/v1/documents")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]
