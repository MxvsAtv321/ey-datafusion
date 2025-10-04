"""Ingest service (B1)."""

from __future__ import annotations

import io
import json
import re
from typing import List

import pandas as pd  # type: ignore


def _decode_bytes_utf8_fallback(content: bytes) -> str:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return content.decode(enc)
        except Exception:
            continue
    # last resort
    return content.decode("utf-8", errors="ignore")


def load_table(content: bytes, filename: str) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith((".csv", ".tsv")):
        text = _decode_bytes_utf8_fallback(content)
        # Use comma/tsv explicit separators to avoid over-splitting on short samples
        if name.endswith((".tsv",)):
            return pd.read_csv(io.StringIO(text), sep="\t")
        return pd.read_csv(io.StringIO(text))
    if name.endswith((".json", ".ndjson")):
        text = _decode_bytes_utf8_fallback(content)
        # Try records/lines first
        try:
            return pd.read_json(io.StringIO(text), lines=True)
        except Exception:
            pass
        # Try standard JSON (array or object)
        try:
            obj = json.loads(text)
            if isinstance(obj, list):
                return pd.json_normalize(obj)
            if isinstance(obj, dict):
                # single object
                return pd.json_normalize([obj])
        except Exception:
            pass
        # Fallback empty
        return pd.DataFrame()
    if name.endswith((".xlsx", ".xlsm", ".xls")):
        return pd.read_excel(io.BytesIO(content), sheet_name=0)
    # Unknown: attempt CSV as default
    text = _decode_bytes_utf8_fallback(content)
    try:
        return pd.read_csv(io.StringIO(text))
    except Exception:
        return pd.DataFrame()


def normalize_headers(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    original: List[str] = list(df.columns)
    df.attrs["original_columns"] = original

    def to_snake(value: str) -> str:
        v = str(value).strip().lower()
        v = re.sub(r"[^a-z0-9]+", "_", v)
        v = re.sub(r"_+", "_", v)
        v = v.strip("_")
        return v or "col"

    new_cols: List[str] = []
    seen: dict[str, int] = {}
    for col in original:
        base = to_snake(col)
        count = seen.get(base, 0)
        if count == 0:
            new_name = base
        else:
            new_name = f"{base}_{count}"
        seen[base] = count + 1
        new_cols.append(new_name)
    df.columns = new_cols
    return df


