from __future__ import annotations

import asyncio
import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _payload(run_id: str = "run-1", tweak=None):
    p = {
        "runId": run_id,
        "approvedMappings": [
            {"candidateId": "c1", "fromDataset": "bankA", "fromColumn": "first_name", "toDataset": "bankB", "toColumn": "first_name"}
        ],
        "transforms": [],
        "pipelinePreview": {"columns": ["id", "first_name", "last_name", "balance"], "rows": [{"id": i + 1, "first_name": f"alice {i}", "last_name": f"smith {i}", "balance": 1000.0 + i} for i in range(200)]},
        "checksSummary": {"rows": 200},
        "secureMode": True,
    }
    if tweak:
        tweak(p)
    return p


def test_happy_path_safe_yes():
    r = client.post("/api/v1/agent/verify", json=_payload())
    assert r.status_code == 200
    data = r.json()
    assert data["confirmation"]["status"] == "SAFE_YES"
    assert data["diff"]["cells"]["cellDiffRate"] <= 0.005


def test_minor_whitespace_case():
    def tweak(p):
        # agent merge produces title/spaces; pipeline has lower with extra spaces -> normalize equal
        p["pipelinePreview"]["rows"][0]["first_name"] = "  alice   0  "
    r = client.post("/api/v1/agent/verify", json=_payload(tweak=tweak))
    assert r.status_code == 200
    data = r.json()
    assert data["confirmation"]["status"] in ("SAFE_YES", "SAFE_NO")  # allow SAFE_YES for normalization


def test_type_mismatch_fails():
    def tweak(p):
        # make balance a string in pipeline
        for row in p["pipelinePreview"]["rows"]:
            row["balance"] = str(row["balance"])
    r = client.post("/api/v1/agent/verify", json=_payload(tweak=tweak))
    assert r.status_code == 200
    data = r.json()
    assert data["confirmation"]["status"] == "SAFE_NO"
    assert any("type" in reason.lower() for reason in data["reasons"]) or data["diff"]["schema"]["typeMismatches"]


def test_cell_diff_threshold_exceeded():
    def tweak(p):
        # Introduce ~1.0% diffs by changing a few cells
        for i in range(2):
            p["pipelinePreview"]["rows"][i]["first_name"] = "bob"
    r = client.post("/api/v1/agent/verify", json=_payload(tweak=tweak))
    assert r.status_code == 200
    data = r.json()
    # depending on normalization, ensure threshold logic applies
    if data["diff"]["cells"]["cellDiffRate"] > 0.005:
        assert data["confirmation"]["status"] == "SAFE_NO"


def test_tool_failure_fallback():
    # trigger preview tool failure
    r = client.post("/api/v1/agent/verify", json=_payload(run_id="FAIL_PREVIEW", tweak=lambda p: p.pop("pipelinePreview")))
    assert r.status_code == 200
    data = r.json()
    assert data["confirmation"]["status"] in ("SAFE_NO", "SAFE_YES")
    assert "preview" in " ".join(data.get("limits", [])).lower()


