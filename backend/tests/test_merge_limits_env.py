import os
from importlib import reload
from fastapi.testclient import TestClient


def _csv(content: str) -> tuple[str, bytes, str]:
    return ("files", ("tmp.csv", content.encode("utf-8"), "text/csv"))


def test_merge_limits_from_env(monkeypatch):
    os.environ["MERGE_PREVIEW_DEFAULT"] = "17"
    os.environ["MERGE_PREVIEW_MAX"] = "32"
    # re-import routes to re-read settings (app already imports settings on startup; this is best-effort)
    import app.core.config as cfg
    reload(cfg)
    import app.main as main
    reload(main)
    client = TestClient(main.app)

    left = "id\n" + "\n".join(str(i) for i in range(100)) + "\n"
    right = "identifier\n" + "\n".join(str(i) for i in range(2)) + "\n"
    files = [_csv(left), _csv(right)]

    r = client.post("/api/v1/merge", files=files)
    assert r.status_code == 200
    data = r.json()
    assert len(data["preview_rows"]) <= 17

    r2 = client.post("/api/v1/merge?limit=999", files=files)
    assert r2.status_code == 422

    r3 = client.post("/api/v1/merge?limit=32", files=files)
    assert r3.status_code == 200
    assert len(r3.json()["preview_rows"]) <= 32

