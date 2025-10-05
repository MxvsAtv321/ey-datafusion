from __future__ import annotations

from typing import List, Dict, Tuple
import numpy as np
from app.core.config import settings
from app.schemas.profile import TableProfile, ColumnProfile

try:
    from rapidfuzz import fuzz
except Exception:  # pragma: no cover
    fuzz = None

# Optional: Hungarian assignment for globally optimal pairing
try:  # pragma: no cover - SciPy might not be installed in all environments
    from scipy.optimize import linear_sum_assignment  # type: ignore
except Exception:  # pragma: no cover
    linear_sum_assignment = None


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


_STOP_TOKENS = {"bank1","bank2","mock","schema","xlsx","csv","xls"}

def _canonical_table(name: str) -> str:
    base = name.lower()
    # strip common separators and extension
    for ch in [".", "-", "/", "\\", "(", ")"]:
        base = base.replace(ch, "_")
    tokens = [t for t in base.replace(".xlsx"," ").replace(".csv"," ").split("_") if t]
    tokens = [t for t in tokens if t not in _STOP_TOKENS]
    return "_".join(tokens)

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

    # Order matters: classify specific domains BEFORE generic buckets to avoid mis-bucketing
    if has_any("loan","interest","principal","amort","emi"):
        return "loans"  # includes loan_accounts, loan_transactions
    if has_any("customer","fname","lname","email","phone","dob"):
        return "customers"
    if has_any("txn","transaction","posted_date","merchant"):
        return "transactions"
    if has_any("address","line1","city","postcode","zip","country"):
        return "addresses"
    if has_any("identification","passport","national_id","id_card"):
        return "identifications"
    # Deposit/current/savings style accounts
    if has_any("account","iban","balance","currency","open_date","deposit","current","savings","cur","sav","cursav"):
        return "accounts"
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


def pair_tables(left: List[TableProfile], right: List[TableProfile], min_score: float | None = None, mode: str = "balanced") -> Tuple[List[Dict], List[str], List[str], Dict]:
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

    pairs: List[Dict] = []

    # 0) Lock in exact canonical-name matches first to avoid obvious swaps
    used_l: set[int] = set()
    used_r: set[int] = set()
    canon_left: Dict[str, List[int]] = {}
    canon_right: Dict[str, List[int]] = {}
    for i, lt in enumerate(L):
        canon_left.setdefault(_canonical_table(lt.table), []).append(i)
    for j, rt in enumerate(R):
        canon_right.setdefault(_canonical_table(rt.table), []).append(j)
    for key, li in canon_left.items():
        rj = canon_right.get(key)
        if not rj or len(li) != 1 or len(rj) != 1:
            continue
        i = li[0]
        j = rj[0]
        if i in used_l or j in used_r:
            continue
        s = float(matrix[i][j])
        if s >= (min_score or 0.0):
            ent, reasons, warnings = pair_meta[(i, j)]
            reasons = list(reasons) + ["Canonical name match"]
            decision = "auto" if s >= settings.tablepair_auto_threshold_pct else "review"
            pairs.append({
                "left_table": L[i].table,
                "right_table": R[j].table,
                "score": round(s, 6),
                "decision": decision,
                "entity_type": ent,
                "reasons": reasons,
                "warnings": warnings,
            })
            used_l.add(i)
            used_r.add(j)

    # 0b) Mutual-top lock-in for high-confidence name matches
    # Compute top choice indices
    if len(L) > 0 and len(R) > 0:
        top_r_for_l = [max(range(len(R)), key=lambda j: matrix[i][j]) if len(R) > 0 else -1 for i in range(len(L))]
        top_l_for_r = [max(range(len(L)), key=lambda i: matrix[i][j]) if len(L) > 0 else -1 for j in range(len(R))]
        for i in range(len(L)):
            if i in used_l: continue
            j = top_r_for_l[i]
            if j < 0 or j in used_r: continue
            if top_l_for_r[j] != i: continue
            # Require strong table-name similarity to avoid false locks
            if _name_sim(L[i].table, R[j].table) < 0.8 and _canonical_table(L[i].table) != _canonical_table(R[j].table):
                continue
            s = float(matrix[i][j])
            if s < (min_score or 0.0):
                continue
            ent, reasons, warnings = pair_meta[(i, j)]
            reasons = list(reasons) + ["Mutual top by score"]
            decision = "auto" if s >= settings.tablepair_auto_threshold_pct else "review"
            pairs.append({
                "left_table": L[i].table,
                "right_table": R[j].table,
                "score": round(s, 6),
                "decision": decision,
                "entity_type": ent,
                "reasons": reasons,
                "warnings": warnings,
            })
            used_l.add(i)
            used_r.add(j)

    # Enforce entity-aware pairing: match within same inferred entity first
    left_by_ent: Dict[str, List[int]] = {}
    right_by_ent: Dict[str, List[int]] = {}
    for i, lt in enumerate(L):
        if i in used_l: continue
        left_by_ent.setdefault(_infer_entity(lt), []).append(i)
    for j, rt in enumerate(R):
        if j in used_r: continue
        right_by_ent.setdefault(_infer_entity(rt), []).append(j)

    def assign_block(l_idx: List[int], r_idx: List[int]) -> None:
        if not l_idx or not r_idx:
            return
        sub = np.array([[matrix[i][j] for j in r_idx] for i in l_idx], dtype=float)
        if linear_sum_assignment is not None and sub.size > 0:
            ls, rs = sub.shape
            size = max(ls, rs)
            sq = np.zeros((size, size), dtype=float)
            sq[:ls, :rs] = sub
            cost = 1.0 - sq
            row_ind, col_ind = linear_sum_assignment(cost)
            for ri, ci in zip(row_ind, col_ind):
                if ri >= ls or ci >= rs:
                    continue
                i = l_idx[ri]
                j = r_idx[ci]
                if i in used_l or j in used_r:
                    continue
                s = float(matrix[i][j])
                if s < (min_score or 0.0):
                    continue
                ent, reasons, warnings = pair_meta[(i, j)]
                decision = "auto" if s >= settings.tablepair_auto_threshold_pct else "review"
                pairs.append({
                    "left_table": L[i].table,
                    "right_table": R[j].table,
                    "score": round(s, 6),
                    "decision": decision,
                    "entity_type": ent,
                    "reasons": reasons,
                    "warnings": warnings,
                })
                used_l.add(i)
                used_r.add(j)
        else:
            # Greedy within block
            candidates: List[Tuple[float, int, int]] = []
            for i in l_idx:
                for j in r_idx:
                    candidates.append((matrix[i][j], i, j))
            candidates.sort(key=lambda x: x[0], reverse=True)
            for s, i, j in candidates:
                if s < (min_score or 0.0):
                    break
                if i in used_l or j in used_r:
                    continue
                ent, reasons, warnings = pair_meta[(i, j)]
                decision = "auto" if s >= settings.tablepair_auto_threshold_pct else "review"
                pairs.append({
                    "left_table": L[i].table,
                    "right_table": R[j].table,
                    "score": round(float(s), 6),
                    "decision": decision,
                    "entity_type": ent,
                    "reasons": reasons,
                    "warnings": warnings,
                })
                used_l.add(i)
                used_r.add(j)

    # Same-entity first (skip unknown in strict mode)
    for ent in sorted(set(left_by_ent.keys()) | set(right_by_ent.keys())):
        if ent == "unknown" and mode == "strict":
            continue
        assign_block(left_by_ent.get(ent, []), right_by_ent.get(ent, []))

    # Cross-entity phase: only if lenient; otherwise, leave unpaired
    if mode == "lenient":
        leftovers: List[Tuple[float, int, int]] = []
        for i in range(len(L)):
            if i in used_l:
                continue
            for j in range(len(R)):
                if j in used_r:
                    continue
                # Penalize cross-entity pairs to prefer within-entity
                ent_i, _, _ = pair_meta[(i, j)]
                s = matrix[i][j]
                leftovers.append((s, i, j))
        leftovers.sort(key=lambda x: x[0], reverse=True)
        for s, i, j in leftovers:
            if s < (min_score or 0.0):
                break
            ent, reasons, warnings = pair_meta[(i, j)]
            decision = "review" if s < settings.tablepair_auto_threshold_pct else "auto"
            pairs.append({
                "left_table": L[i].table,
                "right_table": R[j].table,
                "score": round(float(s), 6),
                "decision": decision,
                "entity_type": ent,
                "reasons": reasons,
                "warnings": warnings,
            })
            used_l.add(i)
            used_r.add(j)

    paired_left = {p["left_table"] for p in pairs}
    paired_right = {p["right_table"] for p in pairs}
    unpaired_left = [t.table for t in L if t.table not in paired_left]
    unpaired_right = [t.table for t in R if t.table not in paired_right]

    return pairs, unpaired_left, unpaired_right, {"left": names_l, "right": names_r, "scores": matrix}


