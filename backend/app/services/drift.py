from __future__ import annotations

from typing import Dict, Any, List
from app.core.config import settings


def drift_between(baseline: Dict[str, Any], current: Dict[str, Any]):
    # baseline/current expected shape: { table: { columns_profile: [{name,dtype,null_count, ...}], rows, ... } }
    def colmap(profile: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        cols = profile.get("columns_profile") or profile.get("columns") or []
        return {c.get("name"): c for c in cols}

    added, removed, renamed, type_changed, nullrate_delta = [], [], [], [], []

    for tname, bprof in baseline.items():
        cprof = current.get(tname, {})
        bcols = colmap(bprof)
        ccols = colmap(cprof)
        bnames = set(bcols.keys())
        cnames = set(ccols.keys())
        added += sorted(list(cnames - bnames))
        removed += sorted(list(bnames - cnames))
        # type changes
        for name in sorted(bnames & cnames):
            bt = bcols[name].get("dtype")
            ct = ccols[name].get("dtype")
            if bt != ct:
                type_changed.append({"col": name, "from": bt, "to": ct})
            # null rate delta (approx, using null_count / rows)
            try:
                bnull = float(bcols[name].get("null_count", 0))
                cnull = float(ccols[name].get("null_count", 0))
                brows = float(bprof.get("rows", 1) or 1)
                crows = float(cprof.get("rows", 1) or 1)
                b_rate = bnull / (brows or 1)
                c_rate = cnull / (crows or 1)
                delta = c_rate - b_rate
                if abs(delta) > 1e-9:
                    nullrate_delta.append({"col": name, "delta": round(delta, 6)})
            except Exception:
                pass

    # severity
    sev = "info"
    if type_changed or any(abs(x.get("delta", 0)) > settings.drift_crit_delta for x in nullrate_delta):
        sev = "critical"
    elif any(abs(x.get("delta", 0)) > settings.drift_warn_delta for x in nullrate_delta):
        sev = "warning"

    return {
        "added": added,
        "removed": removed,
        "renamed": renamed,
        "type_changed": type_changed,
        "nullrate_delta": nullrate_delta,
        "severity": sev,
    }


