import pandas as pd
from app.services.transform_dsl import validate_ops, apply_ops, TransformError


def test_strip_upper_lower_and_numeric():
    df = pd.DataFrame({"a": [" x ", "y"], "b": ["1", "2"]})
    ops = validate_ops([
        {"op": "strip", "args": {"field": "a"}},
        {"op": "upper", "args": {"field": "a"}},
        {"op": "to_int", "args": {"field": "b"}},
    ])
    out = apply_ops(df, ops)
    assert list(out["a"]) == ["X", "Y"]
    assert str(out["b"].dtype) == "Int64"


def test_concat_split_regex_map():
    df = pd.DataFrame({"first": ["John"], "last": ["Doe"], "raw": ["AB-1234"], "status": ["Open"]})
    ops = validate_ops([
        {"op": "concat", "args": {"fields": ["first", "last"], "sep": " ", "target": "full"}},
        {"op": "split", "args": {"field": "full", "sep": " ", "index": 0, "target": "first2"}},
        {"op": "regex_extract", "args": {"field": "raw", "pattern": r"(\w{2})-(\d{4})", "group": 2, "target": "year"}},
        {"op": "map_values", "args": {"field": "status", "mapping": {"Open": "ACTIVE"}}},
    ])
    out = apply_ops(df, ops)
    assert out.loc[0, "full"] == "John Doe"
    assert out.loc[0, "first2"] == "John"
    assert out.loc[0, "year"] == "1234"
    assert out.loc[0, "status"] == "ACTIVE"


def test_validation_errors():
    try:
        validate_ops([{"op": "concat", "args": {"fields": []}}])
        assert False, "expected error"
    except TransformError:
        pass

