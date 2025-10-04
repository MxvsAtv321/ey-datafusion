import os
from importlib import reload
import pandas as pd


def _reload_match_with_env(env: dict[str, str]):
    for k, v in env.items():
        os.environ[k] = v
    import app.core.config as cfg
    reload(cfg)
    import app.services.match as match
    reload(match)
    return match


def test_match_confidence_respects_env_weights(monkeypatch):
    # Case 1: heavily weighted to name
    match = _reload_match_with_env({
        "MATCH_WEIGHT_NAME": "0.90",
        "MATCH_WEIGHT_TYPE": "0.05",
        "MATCH_WEIGHT_OVERLAP": "0.05",
        "MATCH_WEIGHT_EMBED": "0.00",
    })

    left = pd.DataFrame({"acct_id": [1, 2, 3]})
    right = pd.DataFrame({"account_id": [4, 5, 6]})
    cands = match.suggest_mappings(left, right, sample_n=3, threshold=0.0)
    # Find the acct_id -> account_id candidate
    cand = next(c for c in cands if c["left_column"] == "acct_id" and c["right_column"] == "account_id")
    name = cand["scores"]["name"]
    vtype = cand["scores"]["type"]
    overlap = cand["scores"]["value_overlap"]
    emb = cand["scores"]["embedding"]
    # Weights normalized
    wn, wt, wo, we = 0.90, 0.05, 0.05, 0.00
    total = wn + wt + wo + we
    wn, wt, wo, we = wn/total, wt/total, wo/total, we/total
    expected = wn * name + wt * vtype + wo * overlap + we * emb
    assert abs(cand["confidence"] - expected) < 1e-6

    # Case 2: balanced default weights
    match = _reload_match_with_env({
        "MATCH_WEIGHT_NAME": "0.45",
        "MATCH_WEIGHT_TYPE": "0.20",
        "MATCH_WEIGHT_OVERLAP": "0.20",
        "MATCH_WEIGHT_EMBED": "0.15",
    })
    cands = match.suggest_mappings(left, right, sample_n=3, threshold=0.0)
    cand = next(c for c in cands if c["left_column"] == "acct_id" and c["right_column"] == "account_id")
    name = cand["scores"]["name"]
    vtype = cand["scores"]["type"]
    overlap = cand["scores"]["value_overlap"]
    emb = cand["scores"]["embedding"]
    wn, wt, wo, we = 0.45, 0.20, 0.20, 0.15
    total = wn + wt + wo + we
    wn, wt, wo, we = wn/total, wt/total, wo/total, we/total
    expected2 = wn * name + wt * vtype + wo * overlap + we * emb
    assert abs(cand["confidence"] - expected2) < 1e-6

