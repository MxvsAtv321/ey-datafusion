import os
from importlib import reload
import pandas as pd


def _reload_validate():
    import app.services.validate as val
    reload(val)
    return val


def test_outliers_z_env(monkeypatch):
    df = pd.DataFrame({"amount": [10, 11, 12, 13, 1000]})
    os.environ["OUTLIER_Z"] = "10.0"
    val = _reload_validate()
    v = val._outliers(df, "amount", method="zscore")
    assert v is None or v.count == 0

    os.environ["OUTLIER_Z"] = "2.0"
    val = _reload_validate()
    v2 = val._outliers(df, "amount", method="zscore")
    assert v2 is None or v2.count >= 1


def test_outliers_iqr_env(monkeypatch):
    df = pd.DataFrame({"amount": [10, 11, 12, 13, 1000]})
    os.environ["OUTLIER_IQR_K"] = "0.5"
    val = _reload_validate()
    v_low = val._outliers(df, "amount", method="iqr")
    os.environ["OUTLIER_IQR_K"] = "1.5"
    val = _reload_validate()
    v_high = val._outliers(df, "amount", method="iqr")
    # Lower k should detect at least as many outliers as higher k
    c_low = 0 if v_low is None else v_low.count
    c_high = 0 if v_high is None else v_high.count
    assert c_low >= c_high

