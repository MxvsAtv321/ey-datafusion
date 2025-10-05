from __future__ import annotations

from typing import Literal
from ..utils.normalize import infer_column_type


async def profile(dataset: Literal["bankA", "bankB"], sample_size: int = 200) -> dict:
    """Return a deterministic mock profile useful for tests.

    Structure: {columns, types, blanksPct, likelyKeys, sampleRows}
    """
    # simple deterministic columns per dataset
    if dataset == "bankA":
        columns = ["id", "first_name", "last_name", "balance"]
    else:
        columns = ["id", "first_name", "last_name", "balance"]
    rows: list[dict] = []
    for i in range(min(sample_size, 200)):
        rows.append({
            "id": i + 1,
            "first_name": f"Alice{i}",
            "last_name": f"Smith{i}",
            "balance": float(1000 + i),
        })
    types = {c: infer_column_type([r.get(c) for r in rows]) for c in columns}
    blanks_pct = {c: 0.0 for c in columns}
    likely_keys = ["id"]
    return {
        "columns": columns,
        "types": types,
        "blanksPct": blanks_pct,
        "likelyKeys": likely_keys,
        "sampleRows": rows,
    }


