from app.services.match import suggest_mappings
import pandas as pd


def test_family_gate_caps_cross_domain(monkeypatch):
    # Build small frames with cross-family names
    df_left = pd.DataFrame({"accountid": ["A1","A2","A3"]})
    df_right = pd.DataFrame({"country": ["US","CA","GB"]})
    out = suggest_mappings(df_left, df_right, sample_n=10, threshold=0.0)
    cand = next(c for c in out if c["left_column"]=="accountid" and c["right_column"]=="country")
    assert cand["confidence"] <= 0.49
    assert "Cross-family pair" in cand["warnings"]
