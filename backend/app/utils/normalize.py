from __future__ import annotations

import datetime as _dt
import re
from typing import Any, Literal


_SPACE_RE = re.compile(r"\s+")
_NUM_RE = re.compile(r"[^0-9+\-.,]")
_DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d-%m-%Y",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d",
]


def norm_string(s: Any) -> str | None:
    if s is None:
        return None
    s = str(s)
    s = s.strip()
    if s == "":
        return None
    s = _SPACE_RE.sub(" ", s)
    return s.lower()


def norm_number(v: Any) -> float | None:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if s == "":
        return None
    s = _NUM_RE.sub("", s)
    # if both comma and dot appear, assume comma is thousands sep
    if "," in s and "." in s:
        s = s.replace(",", "")
    else:
        # if only comma, treat as decimal point
        if "," in s and "." not in s:
            s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def norm_date(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, (_dt.date, _dt.datetime)):
        return str(getattr(v, "date", lambda: v)()) if isinstance(v, _dt.datetime) else v.isoformat()
    s = str(v).strip()
    if s == "":
        return None
    for fmt in _DATE_PATTERNS:
        try:
            dt = _dt.datetime.strptime(s, fmt)
            return dt.date().isoformat()
        except ValueError:
            continue
    # simple YYYYMMDD
    if re.fullmatch(r"\d{8}", s):
        try:
            dt = _dt.datetime.strptime(s, "%Y%m%d")
            return dt.date().isoformat()
        except ValueError:
            pass
    return None


def infer_type(v: Any) -> Literal["string", "number", "boolean", "date", "unknown"]:
    if v is None:
        return "unknown"
    if isinstance(v, bool):
        return "boolean"
    if norm_number(v) is not None and isinstance(v, (int, float)) or (isinstance(v, str) and norm_number(v) is not None):
        return "number"
    if norm_date(v) is not None:
        return "date"
    if isinstance(v, (str, bytes)):
        return "string"
    return "unknown"


def infer_column_type(col_values: list[Any]) -> str:
    seen = {infer_type(v) for v in col_values if v is not None}
    if not seen:
        return "unknown"
    if seen == {"number"}:
        return "number"
    if seen == {"date"}:
        return "date"
    if seen == {"boolean"}:
        return "boolean"
    if seen <= {"string", "unknown"}:
        return "string"
    # mixed types
    if "number" in seen and "string" in seen and len(seen) <= 3:
        return "string"  # safe default for display
    return "unknown"


