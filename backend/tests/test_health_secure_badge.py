from fastapi.testclient import TestClient
from app.main import app


def test_healthz_secure_fields_present():
    client = TestClient(app)
    r = client.get("/api/v1/healthz")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("regulated_mode"), bool)
    assert isinstance(data.get("masking_policy"), dict)
    assert "profile_examples_masked" in data.get("masking_policy", {})
    assert isinstance(data.get("embeddings_enabled"), bool)

