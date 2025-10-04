import os
from importlib import reload
import pandas as pd


def _reload_profile_with_env(val: str):
    os.environ["PK_UNIQUE_RATIO"] = val
    import app.core.config as cfg
    reload(cfg)
    import app.services.profile as profile
    reload(profile)
    return profile


def test_pk_ratio_env_affects_candidate_pk():
    df = pd.DataFrame({"id": [1,2,3,4,5,6,7,8,9,1]})  # 9 unique out of 10
    p = _reload_profile_with_env("0.95")
    t = p.profile_table(df, "t", sample_n=10)
    col = next(c for c in t.columns_profile if c.name == "id")
    assert col.candidate_primary_key_sampled is False

    p = _reload_profile_with_env("0.85")
    t = p.profile_table(df, "t", sample_n=10)
    col = next(c for c in t.columns_profile if c.name == "id")
    assert col.candidate_primary_key_sampled is True

