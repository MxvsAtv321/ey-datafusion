from __future__ import annotations

from typing import List, Dict, Tuple
from app.core.config import settings
from app.schemas.profile import TableProfile, ColumnProfile

try:
    from rapidfuzz import fuzz
except Exception:  # pragma: no cover
    fuzz = None


def _norm_name(s: str) -> str:
    s0 = s.lower().strip()
    s0 = s0.replace("_", " ")
    return s0


def _name_sim(a: str, b: str) -> float:
    a1, b1 = _norm_name(a), _norm_name(b)
    if not fuzz:
        return 1.0 if a1 == b1 else 0.0
    return max(
        fuzz.token_sort_ratio(a, b),
        fuzz.partial_ratio(a, b),
        fuzz.token_sort_ratio(a1, b1),
        fuzz.partial_ratio(a1, b1),
    ) / 100.0


_TAG_VOCAB = [
    "email_like","phone_like","iban_like","date_iso","currency_amount_like",
    "address_like","id_like","name_like","code_like"
]


def _tag_distribution(t: TableProfile) -> List[float]:
    counts: Dict[str, int] = {k: 0 for k in _TAG_VOCAB}
    for c in t.columns_profile:
        for tag in c.semantic_tags:
            if tag in counts:
                counts[tag] += 1
    total = sum(counts.values()) or 1
    return [counts[k] / total for k in _TAG_VOCAB]


def _dtype_hist(t: TableProfile) -> List[float]:
    kinds = ["string","number","integer","boolean","datetime"]
    counts: Dict[str, int] = {k: 0 for k in kinds}
    for c in t.columns_profile:
        k = c.dtype if c.dtype in counts else "string"
        counts[k] += 1
    total = sum(counts.values()) or 1
    return [counts[k] / total for k in kinds]


def _cosine(a: List[float], b: List[float]) -> float:
    num = sum(x * y for x, y in zip(a, b))
    da = (sum(x * x for x in a) or 1) ** 0.5
    db = (sum(y * y for y in b) or 1) ** 0.5
    return num / (da * db)


def _row_ratio(a: int, b: int) -> float:
    m = min(a or 1, b or 1)
    M = max(a or 1, b or 1)
    base = m / M
    # mild penalty for large scale gaps
    if M > 0 and M / max(1, m) > 50:
        base *= 0.8
    return base


def _has_pk(t: TableProfile) -> bool:
    return any(c.candidate_primary_key_sampled for c in t.columns_profile)


def _infer_entity(t: TableProfile) -> str:
    n = t.table.lower()
    tags = {tag for c in t.columns_profile for tag in c.semantic_tags}
    def has_any(*k: str) -> bool:
        return any(x in n for x in k) or any(x.replace("_like","") in tags for x in k)
    if has_any("customer","fname","lname","email","phone","dob"):
        return "customers"
    if has_any("account","iban","balance","currency","open_date"):
        return "accounts"
    if has_any("loan","interest","principal"):
        return "loans"
    if has_any("txn","transaction","posted_date","merchant"):
        return "transactions"
    if has_any("address","line1","city","postcode","zip","country"):
        return "addresses"
    if has_any("identification","passport","national_id"):
        return "identifications"
    return "unknown"


def _score_pair(l: TableProfile, r: TableProfile) -> Tuple[float, str, List[str], List[str]]:
    reasons: List[str] = []
    warnings: List[str] = []
    wn = settings.tablepair_w_name
    wt = settings.tablepair_w_tags
    wd = settings.tablepair_w_dtype
    wr = settings.tablepair_w_rows
    wk = settings.tablepair_w_keys
    we = settings.tablepair_w_entity
    total = max(1e-9, wn + wt + wd + wr + wk + we)
    wn, wt, wd, wr, wk, we = [w / total for w in [wn, wt, wd, wr, wk, we]]

    N = _name_sim(l.table, r.table)
    if N >= 0.8:
        reasons.append("Name tokens overlap")

    T = _cosine(_tag_distribution(l), _tag_distribution(r))
    if T >= 0.6:
        reasons.append("Semantic tags similar")

    D = _cosine(_dtype_hist(l), _dtype_hist(r))
    R = _row_ratio(l.rows, r.rows)
    if R >= 0.7:
        reasons.append("Rowcount aligned")
    K = 1.0 if (_has_pk(l) and _has_pk(r)) else (0.5 if (_has_pk(l) or _has_pk(r)) else 0.0)
    le = _infer_entity(l)
    re = _infer_entity(r)
    E = 0.2 if le == re and le != "unknown" else 0.0
    score = wn * N + wt * T + wd * D + wr * R + wk * K + we * E
    return score, (le if le == re else (le if le != "unknown" else re)), reasons, warnings


def pair_tables(left: List[TableProfile], right: List[TableProfile], min_score: float | None = None) -> Tuple[List[Dict], List[str], List[str], Dict]:
    L = left
    R = right
    if min_score is None:
        min_score = settings.tablepair_min_score
    names_l = [t.table for t in L]
    names_r = [t.table for t in R]
    matrix: List[List[float]] = [[0.0 for _ in R] for _ in L]
    pair_meta: Dict[Tuple[int,int], Tuple[str, List[str], List[str]]] = {}
    for i, lt in enumerate(L):
        for j, rt in enumerate(R):
            s, ent, reasons, warnings = _score_pair(lt, rt)
            # Cross-bucket penalty for unknowns can be modeled here if desired
            matrix[i][j] = s
            pair_meta[(i,j)] = (ent, reasons, warnings)

    # Greedy matching with deterministic tie-breakers
    used_r = set()
    pairs: List[Dict] = []
    for i, lt in sorted(list(enumerate(L)), key=lambda x: names_l[x[0]].lower()):
        # pick best r not used
        best = (-1.0, -1, None)
        for j, rt in sorted(list(enumerate(R)), key=lambda x: names_r[x[0]].lower()):
            if j in used_r:
                continue
            s = matrix[i][j]
            if s > best[0] or (abs(s - best[0]) < 1e-9 and names_r[j].lower() < names_r[best[1]].lower() if best[1] != -1 else True):
                best = (s, j, rt)
        if best[1] == -1:
            continue
        used_r.add(best[1])
        ent, reasons, warnings = pair_meta[(i, best[1])]
        decision = "auto" if best[0] >= (settings.tablepair_auto_threshold_pct) else "review"
        pairs.append({
            "left_table": L[i].table,
            "right_table": R[best[1]].table,
            "score": round(best[0], 6),
            "decision": decision,
            "entity_type": ent,
            "reasons": reasons,
            "warnings": warnings,
        })

    paired_left = {p["left_table"] for p in pairs}
    paired_right = {p["right_table"] for p in pairs}
    unpaired_left = [t.table for t in L if t.table not in paired_left and max(matrix[L.index(t)] or [0.0]) < min_score]
    unpaired_right = [t.table for t in R if t.table not in paired_right]

    return pairs, unpaired_left, unpaired_right, {"left": names_l, "right": names_r, "scores": matrix}


