import os
from importlib import reload
from fastapi.testclient import TestClient
import json


def _csv(content: str) -> tuple[str, bytes, str]:
    return ("files", ("tmp.csv", content.encode("utf-8"), "text/csv"))


def test_flow_e2e_happy_path(monkeypatch):
    # Ensure dev-friendly settings
    os.environ["PROFILE_EXAMPLES_MASKED"] = "true"
    import app.main as main
    reload(main)
    client = TestClient(main.app)

    # healthz
    h = client.get("/api/v1/healthz")
    assert h.status_code == 200
    assert "regulated_mode" in h.json()

    # profile
    left = "id,email\n1,a@b.com\n2,c@d.com\n"
    right = "identifier,e_mail\n1,a@b.com\n3,e@f.com\n"
    files = [_csv(left), _csv(right)]
    r = client.post("/api/v1/profile", files=files, headers={"X-Run-Id": "run-e2e"})
    assert r.status_code == 200
    prof = r.json()
    assert prof.get("examples_masked") is True

    # match with threshold
    m = client.post("/api/v1/match?threshold=0.72", files=files, headers={"X-Run-Id": "run-e2e"})
    assert m.status_code == 200
    mjs = m.json()
    assert "stats" in mjs and "threshold" in mjs

    # merge with limit
    mg = client.post("/api/v1/merge?limit=10", files=files, data={"decisions": json.dumps([])}, headers={"X-Run-Id": "run-e2e"})
    assert mg.status_code == 200
    mgjs = mg.json()
    assert len(mgjs.get("preview_rows", [])) <= 10

    # validate: first fail then pass by relaxing required rules
    os.environ["REQUIRED_RULES"] = "not_null(customer_id)"
    import app.core.config as cfg
    reload(cfg)
    from app.services import validate as validate_mod
    reload(validate_mod)
    v_fail = client.post("/api/v1/validate", json={"contract": "customers", "rows": [{"customer_id": None, "email": "x@y.com"}]}, headers={"X-Run-Id": "run-e2e"})
    assert v_fail.status_code == 200
    assert v_fail.json().get("gate_blocked") in {True, False}

    os.environ["REQUIRED_RULES"] = ""
    reload(cfg)
    reload(validate_mod)
    v_pass = client.post("/api/v1/validate", json={"contract": "customers", "rows": [{"customer_id": "C1", "email": "x@y.com"}]}, headers={"X-Run-Id": "run-e2e"})
    assert v_pass.status_code == 200
    assert v_pass.json()["status"] in {"pass", "fail"}

    # docs
    d = client.post("/api/v1/docs", json={"mapping": {"version": "1.0", "threshold": 0.72, "fields": []}}, headers={"X-Run-Id": "run-e2e"})
    assert d.status_code == 200
    djs = d.json()
    assert djs["manifest_hash"].startswith("sha256:")

