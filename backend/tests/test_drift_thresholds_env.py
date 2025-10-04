import os
from importlib import reload



def test_drift_severity_env_thresholds(monkeypatch):
    os.environ["DRIFT_WARN_DELTA"] = "0.10"
    os.environ["DRIFT_CRIT_DELTA"] = "0.25"
    import app.core.config as cfg
    reload(cfg)
    import app.services.drift as drift_mod
    reload(drift_mod)

    baseline = {"t": {"rows": 100, "columns_profile": [{"name": "x", "dtype": "number", "null_count": 5}]}}
    current_w = {"t": {"rows": 100, "columns_profile": [{"name": "x", "dtype": "number", "null_count": 17}]}}  # delta 0.12
    current_c = {"t": {"rows": 100, "columns_profile": [{"name": "x", "dtype": "number", "null_count": 30}]}}  # delta 0.25

    w = drift_mod.drift_between(baseline, current_w)
    c = drift_mod.drift_between(baseline, current_c)
    assert w["severity"] in {"warning", "critical"}
    assert c["severity"] == "critical"

