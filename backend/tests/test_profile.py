import pandas as pd

from app.services.profile import infer_semantic_tags, profile_table, dtype_to_simple


def test_semantic_email():
    s = pd.Series(["a@b.com", "c@d.ca", None, "x@y.org"])  # majority email
    tags = infer_semantic_tags(s)
    assert "email_like" in tags


def test_candidate_pk():
    df = pd.DataFrame({"id": list(range(100)), "val": [1]*100})
    prof = profile_table(df, "t", sample_n=100)
    id_col = [c for c in prof.columns_profile if c.name == "id"][0]
    assert id_col.candidate_primary_key_sampled is True


def test_dtype_mapping():
    assert dtype_to_simple(pd.Series([1,2,3]).dtype) == "integer"
    assert dtype_to_simple(pd.Series([1.0,2.0]).dtype) == "number"
    assert dtype_to_simple(pd.Series([True, False]).dtype) == "boolean"

