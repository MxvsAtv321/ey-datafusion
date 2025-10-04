import os
from importlib import reload


def test_presign_ttl_from_env(monkeypatch):
    os.environ["S3_PRESIGN_TTL"] = "120"
    import app.core.config as cfg
    reload(cfg)
    from app.services import storage as storage_mod
    reload(storage_mod)

    called = {}

    class FakeClient:
        def generate_presigned_url(self, ClientMethod, Params, ExpiresIn):
            called["expires"] = ExpiresIn
            return "http://example.com"

    monkeypatch.setattr(storage_mod, "_client", lambda: FakeClient())
    url = storage_mod.presigned_url("k")
    assert called.get("expires") == 120

    os.environ["S3_PRESIGN_TTL"] = "3600"
    reload(cfg)
    reload(storage_mod)
    called.clear()
    monkeypatch.setattr(storage_mod, "_client", lambda: FakeClient())
    url = storage_mod.presigned_url("k")
    assert called.get("expires") == 3600

