"""Profile service stubs (B1 will implement)."""

import pandas as pd  # type: ignore


def dtype_to_simple(pd_dtype) -> str:  # stub
    return "string"


def infer_semantic_tags(series: pd.Series) -> list[str]:  # stub
    return []


def profile_table(df: pd.DataFrame, table_name: str, sample_n: int):  # stub
    return {}


