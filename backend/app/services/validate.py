from __future__ import annotations

from typing import Dict, List

import numpy as np
import pandas as pd

from ..schemas.validate import ValidateResponse, ValidationViolation, ValidateSummary


def _violation(rule: str, count: int, sample: List[int], severity: str = "error") -> ValidationViolation:
    return ValidationViolation(rule=rule, count=count, sample=sample, severity=severity)  # type: ignore[arg-type]


def _not_null(df: pd.DataFrame, field: str) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"not_null({field})", count=len(df), sample=list(range(min(5, len(df)))))
    mask = df[field].isna()
    cnt = int(mask.sum())
    if cnt:
        idxs = df[mask].index.tolist()[:10]
        return _violation(f"not_null({field})", cnt, idxs)
    return None


def _unique(df: pd.DataFrame, field: str) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"unique({field})", count=len(df), sample=list(range(min(5, len(df)))))
    dup_mask = df[field].duplicated(keep=False)
    cnt = int(dup_mask.sum())
    if cnt:
        idxs = df[dup_mask].index.tolist()[:10]
        return _violation(f"unique({field})", cnt, idxs)
    return None


def _regex(df: pd.DataFrame, field: str, pattern: str) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"regex({field})", count=len(df), sample=list(range(min(5, len(df)))))
    s = df[field].dropna().astype(str)
    mism = ~s.str.fullmatch(pattern)
    cnt = int(mism.sum())
    if cnt:
        idxs = s[mism].index.tolist()[:10]
        return _violation(f"regex({field})", cnt, idxs)
    return None


def _enum(df: pd.DataFrame, field: str, values: List[str]) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"enum({field})", count=len(df), sample=list(range(min(5, len(df)))))
    s = df[field]
    mism = ~s.isin(values)
    cnt = int(mism.sum())
    if cnt:
        idxs = s[mism].index.tolist()[:10]
        return _violation(f"enum({field})", cnt, idxs)
    return None


def _range_num(df: pd.DataFrame, field: str, min_val=None, max_val=None) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"range_num({field})", count=len(df), sample=list(range(min(5, len(df)))))
    s = pd.to_numeric(df[field], errors="coerce")
    mask = pd.Series(False, index=s.index)
    if min_val is not None:
        mask = mask | (s < min_val)
    if max_val is not None:
        mask = mask | (s > max_val)
    cnt = int(mask.fillna(False).sum())
    if cnt:
        idxs = s[mask.fillna(False)].index.tolist()[:10]
        return _violation(f"range_num({field})", cnt, idxs)
    return None


def _date_order(df: pd.DataFrame, start: str, end: str) -> ValidationViolation | None:
    if start not in df.columns or end not in df.columns:
        return _violation(f"date_order({start}<={end})", count=len(df), sample=list(range(min(5, len(df)))))
    s = pd.to_datetime(df[start], errors="coerce")
    e = pd.to_datetime(df[end], errors="coerce")
    mask = s > e
    cnt = int(mask.fillna(False).sum())
    if cnt:
        idxs = s[mask.fillna(False)].index.tolist()[:10]
        return _violation(f"date_order({start}<={end})", cnt, idxs)
    return None


def _outliers(df: pd.DataFrame, field: str, method: str = "iqr", z: float = 3.0) -> ValidationViolation | None:
    if field not in df.columns:
        return _violation(f"outliers({field})", count=0, sample=[])
    x = pd.to_numeric(df[field], errors="coerce").dropna()
    if x.empty:
        return None
    if method == "iqr":
        q1 = x.quantile(0.25)
        q3 = x.quantile(0.75)
        iqr = q3 - q1
        lo = q1 - 1.5 * iqr
        hi = q3 + 1.5 * iqr
        mask = (df[field] < lo) | (df[field] > hi)
    else:  # zscore
        mu = x.mean(); sd = x.std(ddof=0)
        if sd == 0:
            return None
        mask = (df[field] - mu).abs() > (z * sd)
    cnt = int(mask.fillna(False).sum())
    if cnt:
        idxs = df[mask.fillna(False)].index.tolist()[:10]
        return _violation(f"outliers({field},{method})", cnt, idxs, severity="warning")
    return None


def run_validation(df: pd.DataFrame, contract_name: str, aux_tables: Dict[str, pd.DataFrame] | None = None) -> ValidateResponse:
    # Minimal contracts demo
    rules: list = []
    if contract_name == "customers":
        rules = [
            ("not_null", {"field": "customer_id"}),
            ("unique", {"field": "customer_id"}),
            ("regex", {"field": "email", "pattern": r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"}),
        ]
    elif contract_name == "accounts":
        rules = [
            ("not_null", {"field": "account_id"}),
            ("range_num", {"field": "balance", "min_val": 0}),
        ]
    elif contract_name == "loans":
        rules = [
            ("not_null", {"field": "loan_id"}),
            ("date_order", {"start": "start_date", "end": "end_date"}),
            ("outliers", {"field": "amount", "method": "zscore", "z": 3.0}),
        ]

    violations: List[ValidationViolation] = []
    for name, kw in rules:
        v = None
        if name == "not_null":
            v = _not_null(df, kw["field"])  # type: ignore[index]
        elif name == "unique":
            v = _unique(df, kw["field"])  # type: ignore[index]
        elif name == "regex":
            v = _regex(df, kw["field"], kw["pattern"])  # type: ignore[index]
        elif name == "enum":
            v = _enum(df, kw["field"], kw["values"])  # type: ignore[index]
        elif name == "range_num":
            v = _range_num(df, kw["field"], kw.get("min_val"), kw.get("max_val"))  # type: ignore[index]
        elif name == "date_order":
            v = _date_order(df, kw["start"], kw["end"])  # type: ignore[index]
        elif name == "outliers":
            v = _outliers(df, kw["field"], kw.get("method", "iqr"), kw.get("z", 3.0))  # type: ignore[index]
        if v:
            violations.append(v)

    status = "pass" if len([v for v in violations if v.severity == "error"]) == 0 else "fail"
    summary = ValidateSummary(rows=int(len(df)), columns=int(df.shape[1]), warnings=int(len([v for v in violations if v.severity == "warning"])) )
    return ValidateResponse(status=status, violations=violations, summary=summary)


