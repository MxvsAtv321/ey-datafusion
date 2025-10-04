from fastapi.testclient import TestClient
from app.main import app


def test_docs_returns_manifest_hash_and_artifacts(monkeypatch):
    # Stub storage
    from app.api import routes as routes_mod

    def fake_put(key, content, content_type="application/octet-stream"):
        return f"s3://bucket/{key}"

    def fake_presigned(key):
        return f"https://example.com/{key}"

    monkeypatch.setattr(routes_mod, "put_object", fake_put)
    monkeypatch.setattr(routes_mod, "presigned_url", fake_presigned)

    client = TestClient(app)
    payload = {"mapping": {"version": "1.0", "threshold": 0.7, "fields": []}, "run_id": "run-test"}
    r = client.post("/api/v1/docs", json=payload, headers={"X-API-Key": "", "X-Run-Id": "run-test"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("run_id") == "run-test"
    assert data.get("manifest_hash", "").startswith("sha256:")
    arts = data.get("artifacts", [])
    assert isinstance(arts, list) and len(arts) == 2
    assert all("url" in a and a["url"].startswith("https://example.com/") for a in arts)

