from __future__ import annotations

from typing import List
from ..schemas.mapping import ApprovedMapping
from ..schemas.transform import TransformSpec
from ..utils.normalize import norm_string, norm_number, norm_date


def _apply_transform(row: dict, t: TransformSpec) -> object:
    if not t.enabled:
        return None
    kind = t.kind
    if kind == "concat":
        parts = [(row.get(x) if row.get(x) is not None else "") for x in (t.inputs or [])]
        sep = (t.options or {}).get("sep", " ")
        return sep.join(str(p) for p in parts)
    val = row.get(t.targetColumn)
    if kind == "trim_spaces":
        s = norm_string(val)
        return None if s is None else s
    if kind == "to_upper":
        s = norm_string(val)
        return None if s is None else s.upper()
    if kind == "to_lower":
        s = norm_string(val)
        return None if s is None else s.lower()
    if kind == "to_title":
        s = norm_string(val)
        return None if s is None else s.title()
    if kind == "cast_number":
        return norm_number(val)
    if kind == "cast_date":
        return norm_date(val)
    return val


async def merge(approved_mappings: List[ApprovedMapping], transforms: List[TransformSpec], sample_size: int = 200) -> dict:
    """Deterministic mock merge:
    - Build base rows from synthetic A/B sources keyed by index.
    - Apply approved mappings by copying A's fromColumn into toColumn.
    - Apply transforms writing into their targetColumn.
    - Return {columns, rows} with at most sample_size rows.
    """
    n = min(sample_size, 200)
    # base synthetic sources
    rowsA: list[dict] = []
    rowsB: list[dict] = []
    for i in range(n):
        rowsA.append({
            "id": i + 1,
            "first_name": f"Alice {i}",
            "last_name": f"Smith {i}",
            "balance": 1000.0 + i,
        })
        rowsB.append({
            "id": i + 1,
            "first_name": f"Alice {i}",
            "last_name": f"Smith {i}",
            "balance": 1000.0 + i,
        })
    # initialize merged rows with B as baseline
    merged: list[dict] = [{**rowsB[i]} for i in range(n)]
    # apply mappings: copy from A fromColumn into merged toColumn
    for m in approved_mappings or []:
        for i in range(n):
            merged[i][m.toColumn] = rowsA[i].get(m.fromColumn)
    # apply transforms
    for t in transforms or []:
        for i in range(n):
            val = _apply_transform(merged[i], t)
            if val is not None:
                merged[i][t.targetColumn] = val
    # compute columns as union across rows, stable order
    seen: dict[str, None] = {}
    for r in merged:
        for k in r.keys():
            if k not in seen:
                seen[k] = None
    columns = list(seen.keys())
    return {"columns": columns, "rows": merged}


