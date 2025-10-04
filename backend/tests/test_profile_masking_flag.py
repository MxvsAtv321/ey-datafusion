from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


client = TestClient(app)


def _csv(s: str) -> tuple[str, bytes, str]:
    return ("files", ("tmp.csv", s.encode("utf-8"), "text/csv"))


def test_profile_examples_masked_flag_true(monkeypatch):
    # Use env override because Settings is frozen
    monkeypatch.setenv("PROFILE_EXAMPLES_MASKED", "true")
    # Re-import settings to pick up env change
    from importlib import reload
    import app.core.config as cfg
    reload(cfg)
    from app.core.config import settings as fresh
    files = [_csv("email\na@b.com\n"),]
    r = client.post("/api/v1/profile", files=files)
    assert r.status_code == 200
    data = r.json()
    assert data["examples_masked"] is True
    any_col = next(iter(data["profiles"].values()))["columns_profile"][0]
    assert "***@***" in any_col["examples"][0]


def test_profile_examples_masked_flag_false(monkeypatch):
    monkeypatch.setenv("PROFILE_EXAMPLES_MASKED", "false")
    from importlib import reload
    import app.core.config as cfg
    reload(cfg)
    from app.core.config import settings as fresh
    files = [_csv("email\na@b.com\n"),]
    r = client.post("/api/v1/profile", files=files)
    assert r.status_code == 200
    data = r.json()
    assert data["examples_masked"] is False
    any_col = next(iter(data["profiles"].values()))["columns_profile"][0]
    assert any_col["examples"][0] == "a@b.com"


