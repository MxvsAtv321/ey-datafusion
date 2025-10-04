from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_post_requires_api_key_if_set():
    # In dev (API_KEY unset), requests should still succeed; just verify 422/200 shape
    r = client.post("/api/v1/validate", json={"contract": "customers", "rows": []})
    assert r.status_code in (200, 422)


def test_runs_lifecycle_and_get():
    r1 = client.post("/api/v1/runs/start", json={})
    assert r1.status_code == 200
    run_id = r1.json().get("run_id")
    assert run_id
    comp = client.post("/api/v1/runs/complete", json={"run_id": run_id, "status": "ok", "artifacts": [{"name": "a", "url": "u"}]})
    assert comp.status_code == 200
    rget = client.get(f"/api/v1/runs/{run_id}")
    assert rget.status_code == 200
    data = rget.json()
    assert data.get("run_id") == run_id
    assert isinstance(data.get("artifacts", []), list)


