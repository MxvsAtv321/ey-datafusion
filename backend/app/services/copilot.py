from __future__ import annotations

from typing import Any, Dict, List


def triage(profiles: Dict[str, Any], candidates: List[Dict[str, Any]] | None, target_precision: float | None = None) -> Dict[str, Any]:
    """Return proposal patches for threshold and mappings.
    Heuristics only; never mutates server state. target_precision is advisory.
    """
    props: List[Dict[str, Any]] = []
    # Threshold proposal based on candidate confidences
    if candidates:
        confs = sorted([float(c.get("confidence", 0.0)) for c in candidates if isinstance(c.get("confidence", 0.0), (int, float))])
        if confs:
            idx = max(0, int(len(confs) * 0.75) - 1)
            thr = round(confs[idx], 2)
            props.append({
                "type": "threshold",
                "value": thr,
                "impact": {"auto_accept": sum(1 for x in confs if x >= thr), "review": sum(1 for x in confs if x < thr), "est_minutes_saved": int(len(confs) * 0.2)},
                "rationale": "Set threshold at 75th percentile of confidence to reduce reviews."
            })
    # Mapping proposals: exact header matches with type compatibility
    if candidates:
        by_left: Dict[str, Dict[str, Any]] = {}
        for c in candidates:
            l = c.get("left_column"); r = c.get("right_column"); s = c.get("scores", {})
            if not (l and r and isinstance(s, dict)):
                continue
            if str(l).lower() == str(r).lower() and s.get("type", 0) >= 0.99:
                cur = by_left.get(l)
                if not cur or c.get("confidence", 0) > cur.get("confidence", 0):
                    by_left[l] = c
        for c in by_left.values():
            props.append({
                "type": "mapping",
                "left": c["left_column"],
                "right": c["right_column"],
                "confidence": round(float(c.get("confidence", 0.0)), 2),
                "rationale": "Exact header match with compatible types.",
            })
    # Transform proposals: whitespace trimming for string heavy columns
    for _, prof in (profiles or {}).items():
        for col in (prof.get("columns_profile") or []):
            if col.get("dtype") == "string":
                examples = col.get("examples", []) or []
                if any((isinstance(x, str) and (x != x.strip())) for x in examples):
                    props.append({
                        "type": "transform",
                        "target": col.get("name"),
                        "ops": [{"op": "strip", "args": {"field": col.get("name")}}],
                        "rationale": "Examples show surrounding whitespace; propose strip().",
                    })
    return {"proposals": props}


def fixit(validate_result: Dict[str, Any]) -> Dict[str, Any]:
    """Suggest low-risk fixes as JSON patches for validation failures.
    Does not modify server state.
    """
    props: List[Dict[str, Any]] = []
    for v in validate_result.get("violations", []):
        rule = v.get("rule", "")
        if rule.startswith("regex(") and "email" in rule:
            props.append({
                "type": "transform",
                "risk": "low",
                "ops": [
                    {"op": "strip", "args": {"field": "email"}},
                    {"op": "lower", "args": {"field": "email"}}
                ],
                "rationale": "Normalize emails by strip+lower to meet regex."
            })
        if rule.startswith("range_num(") and "balance" in rule:
            props.append({
                "type": "transform",
                "risk": "low",
                "ops": [{"op": "to_float", "args": {"field": "balance"}}],
                "rationale": "Cast numeric field to float to enable range checks."
            })
        if rule.startswith("not_null(") and ")" in rule:
            field = rule[len("not_null(") : -1]
            props.append({
                "type": "transform",
                "risk": "medium",
                "ops": [{"op": "strip", "args": {"field": field}}],
                "rationale": "Trim whitespace to reduce accidental null-equivalents before imputation."
            })
    return {"proposals": props}


