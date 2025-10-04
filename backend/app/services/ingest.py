"""Ingest service stubs (B1 will implement)."""

import pandas as pd  # type: ignore


def load_table(content: bytes, filename: str) -> pd.DataFrame:  # stub
    return pd.DataFrame()


def normalize_headers(df: pd.DataFrame) -> pd.DataFrame:  # stub
    return df


