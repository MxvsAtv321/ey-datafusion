from __future__ import annotations

from typing import Any
from ..utils.normalize import norm_string, norm_number, norm_date
import datetime as _dt


def _norm_value(v: Any) -> Any:
    if v is None:
        return None
    # try number
    n = norm_number(v)
    if n is not None:
        return n
    d = norm_date(v)
    if d is not None:
        return d
    s = norm_string(v)
    return s


def _raw_kind(v: Any) -> str:
    if v is None:
        return "unknown"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, (str, bytes)):
        return "string"
    if isinstance(v, (_dt.date, _dt.datetime)):
        return "date"
    return "unknown"


async def compare(a: dict, b: dict, options: dict | None = None) -> dict:
    if options and options.get("force_fail"):
        raise RuntimeError("forced failure")
    cols_a = a.get("columns", [])
    cols_b = b.get("columns", [])
    rows_a = a.get("rows", [])
    rows_b = b.get("rows", [])
    # schema diffs
    set_a = set(cols_a)
    set_b = set(cols_b)
    missing_in_agent = sorted(list(set_b - set_a))
    missing_in_pipeline = sorted(list(set_a - set_b))
    # type mismatches inferred from predominant RAW types (first 50 rows)
    common = [c for c in cols_a if c in set_b]
    type_mismatches: list[dict] = []
    for c in common:
        raw_a = [r.get(c) for r in rows_a[:50]]
        raw_b = [r.get(c) for r in rows_b[:50]]
        kinds_a = [_raw_kind(v) for v in raw_a if v is not None]
        kinds_b = [_raw_kind(v) for v in raw_b if v is not None]
        def majority(kinds: list[str]) -> str:
            if not kinds:
                return "unknown"
            from collections import Counter
            return Counter(kinds).most_common(1)[0][0]
        ta = majority(kinds_a)
        tb = majority(kinds_b)
        if ta != tb and not ({ta, tb} <= {"unknown"}):
            type_mismatches.append({"column": c, "pipelineType": tb, "agentType": ta})
    # cell-level diffs over min length and common columns
    n = min(len(rows_a), len(rows_b), 200)
    examples: list[dict] = []
    by_col_counts: dict[str, int] = {c: 0 for c in common}
    total_cells = n * max(1, len(common))
    diff_cells = 0
    for i in range(n):
        ra = rows_a[i]
        rb = rows_b[i]
        for c in common:
            va = _norm_value(ra.get(c))
            vb = _norm_value(rb.get(c))
            if va != vb:
                diff_cells += 1
                by_col_counts[c] += 1
                if len(examples) < 3:
                    examples.append({"column": c, "rowIndex": i, "aValue": ra.get(c), "bValue": rb.get(c)})
    by_column = [{"column": c, "diffRate": (by_col_counts[c] / n if n else 0.0)} for c in common]
    cell_diff_rate = (diff_cells / total_cells) if total_cells else 0.0
    return {
        "columnDiffs": {
            "missingInA": missing_in_agent,
            "missingInB": missing_in_pipeline,
            "typeMismatches": type_mismatches,
        },
        "rowStats": {"compared": n},
        "cellDiffRate": cell_diff_rate,
        "examples": examples,
        "commonColumns": common,
    }


