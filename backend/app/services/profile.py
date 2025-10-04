"""Profile service (B1)."""

from __future__ import annotations

import math
import re
from typing import List

import pandas as pd  # type: ignore

from ..schemas.profile import ColumnProfile, TableProfile


def dtype_to_simple(pd_dtype) -> str:
    if pd.api.types.is_integer_dtype(pd_dtype):
        return "integer"
    if pd.api.types.is_float_dtype(pd_dtype):
        return "number"
    if pd.api.types.is_bool_dtype(pd_dtype):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(pd_dtype):
        return "datetime"
    return "string"


_SEMANTIC_PATTERNS = {
    "email_like": re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"),
    "phone_like": re.compile(r"^(\+?\d[\d\s\-().]{6,}\d)$"),
    "canadian_postal_code": re.compile(r"^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$", re.I),
    "date_iso": re.compile(r"^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:?\d{2})?)?$"),
    "currency_amount_like": re.compile(r"^\$?\s?-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$"),
    "iban_like": re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$", re.I),
}


def infer_semantic_tags(series: pd.Series) -> List[str]:
    tags: List[str] = []
    sample = series.dropna().astype(str).head(200)
    if sample.empty:
        return tags
    for name, pattern in _SEMANTIC_PATTERNS.items():
        try:
            matches = sample.str.fullmatch(pattern).mean()  # fraction
        except Exception:
            matches = 0.0
        if matches >= 0.5:  # heuristic majority threshold
            tags.append(name)
    return tags


def _safe_examples(series: pd.Series, k: int = 3) -> List[str]:
    vals = series.dropna().astype(str).unique().tolist()
    return vals[:k]


def profile_table(df: pd.DataFrame, table_name: str, sample_n: int) -> TableProfile:
    df_sample = df.head(sample_n)
    columns: List[ColumnProfile] = []
    for col in df_sample.columns:
        s = df_sample[col]
        dtype = dtype_to_simple(s.dtype)
        nulls = int(s.isna().sum())
        unique_count = int(s.nunique(dropna=True))
        cand_pk = unique_count >= min(len(df_sample), sample_n) * 0.99 and nulls == 0
        examples = _safe_examples(s, 3)
        semantic = infer_semantic_tags(s)
        columns.append(
            ColumnProfile(
                name=str(col),
                dtype=dtype,
                null_count=nulls,
                unique_count_sampled=unique_count,
                candidate_primary_key_sampled=bool(cand_pk),
                examples=examples,
                semantic_tags=semantic,
            )
        )
    return TableProfile(
        table=table_name,
        rows=int(len(df)),
        columns=int(df.shape[1]),
        sample_n=int(min(sample_n, len(df))),
        columns_profile=columns,
    )


