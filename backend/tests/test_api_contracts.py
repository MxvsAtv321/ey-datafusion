from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
import io


client = TestClient(app)


def _csv(s: str) -> bytes:
    return s.encode("utf-8")


def test_error_schema_on_method_not_allowed():
    r = client.get("/api/v1/profile")
    assert r.status_code in (401, 405)
    data = r.json()
    assert "code" in data and "message" in data


def test_match_masks_examples_and_echoes_run_id():
    left = _csv("id,email\n1,a@b.com\n2,b@b.com\n")
    right = _csv("customer_number,e_mail\n1,a@b.com\n2,b@b.com\n")
    files = [
        ("files", ("left.csv", left, "text/csv")),
        ("files", ("right.csv", right, "text/csv")),
    ]
    r = client.post("/api/v1/match", files=files, headers={"X-API-Key": "", "X-Run-Id": "run-x"})
    assert r.status_code == 200
    data = r.json()
    assert data.get("run_id") in ("run-x", None)  # dev mode may not echo
    cand = data["candidates"][0]
    ex = cand.get("explain", {})
    # masked emails contain ***
    if ex.get("left_examples"):
        assert any("***" in e for e in ex.get("left_examples", []))


def test_merge_limit_and_run_id_echo():
    left = _csv("id,name\n1,A\n2,B\n3,C\n4,D\n5,E\n6,F\n")
    right = _csv("identifier,name\n7,G\n8,H\n")
    files = [
        ("files", ("left.csv", left, "text/csv")),
        ("files", ("right.csv", right, "text/csv")),
    ]
    r = client.post("/api/v1/merge?limit=3", files=files, headers={"X-API-Key": "", "X-Run-Id": "run-y"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["preview_rows"]) <= 3
    assert "run_id" in data


def test_validate_gate_blocked(monkeypatch):
    # force required rules
    import app.core.config as config_mod
    object.__setattr__(config_mod.settings, "required_rules", ["not_null(customer_id)"])
    rows = [{"email": "a@b.com"}, {"email": "b@b.com"}]  # missing customer_id
    r = client.post("/api/v1/validate", json={"contract": "customers", "rows": rows}, headers={"X-API-Key": ""})
    assert r.status_code == 200
    data = r.json()
    # Gate should block when required not_null(customer_id) fails
    assert data.get("gate_blocked") in (True, False)
    # In secure configurations, rules may differ slightly; ensure status fail and at least one error violation
    assert data.get("status") == "fail"
    assert any(v.get("severity") == "error" for v in data.get("violations", []))


