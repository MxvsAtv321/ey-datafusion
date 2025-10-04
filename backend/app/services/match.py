from __future__ import annotations
from typing import List, Dict, Tuple
import math
import pandas as pd
from app.core.config import settings
from ._masking import mask_examples

try:
    from rapidfuzz import fuzz
except Exception:  # pragma: no cover
    fuzz = None


def _dtype_simple(series: pd.Series) -> str:
    if pd.api.types.is_integer_dtype(series):
        return "integer"
    if pd.api.types.is_float_dtype(series):
        return "number"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    return "string"


def _types_compatible(a: pd.Series, b: pd.Series) -> bool:
    sa, sb = _dtype_simple(a), _dtype_simple(b)
    # Strict equality only; differing families are considered mismatched
    return sa == sb


def _name_score(a: str, b: str) -> float:
    def _norm(x: str) -> str:
        s = x.lower().strip()
        s = s.replace("_", " ")
        # common abbreviations
        synonyms = {
            "acct": "account",
            "cust": "customer",
            "num": "number",
            "no": "number",
            "id": "id",
            "fname": "first name",
            "lname": "last name",
            "addr": "address",
            "e_mail": "email",
        }
        for k, v in synonyms.items():
            s = re.sub(rf"\b{k}\b", v, s)
        return s

    try:
        import re  # local to avoid global import if not needed
    except Exception:
        re = None  # type: ignore

    a0, b0 = a, b
    a1, b1 = _norm(a), _norm(b)
    if not fuzz:
        return 1.0 if a1 == b1 else (1.0 if a0.lower() == b0.lower() else 0.0)
    return max(
        fuzz.token_sort_ratio(a0, b0),
        fuzz.partial_ratio(a0, b0),
        fuzz.token_sort_ratio(a1, b1),
        fuzz.partial_ratio(a1, b1),
    ) / 100.0


def _cosine(a: List[float], b: List[float]) -> float:
    num = sum(x * y for x, y in zip(a, b))
    da = math.sqrt(sum(x * x for x in a))
    db = math.sqrt(sum(y * y for y in b))
    if da == 0 or db == 0:
        return 0.0
    return num / db / da


def _header_embeddings(headers: List[str]) -> List[List[float]]:
    if not settings.embeddings_enabled:
        return [[0.0, 0.0, 0.0] for _ in headers]
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("all-MiniLM-L6-v2")
        return model.encode(headers, normalize_embeddings=True).tolist()
    except Exception:
        return [[0.0, 0.0, 0.0] for _ in headers]


def _value_overlap(sa: pd.Series, sb: pd.Series, sample_n: int) -> Tuple[float, List[str], List[str]]:
    la = set(sa.dropna().astype(str).head(sample_n).unique().tolist())
    lb = set(sb.dropna().astype(str).head(sample_n).unique().tolist())
    inter = la & lb
    union = la | lb
    jacc = len(inter) / max(1, len(union))
    ex_a = list(sa.dropna().astype(str).head(3).unique())
    ex_b = list(sb.dropna().astype(str).head(3).unique())
    return jacc, mask_examples(ex_a), mask_examples(ex_b)


def _reasons_and_warnings(scores: Dict[str, float], embeddings_enabled: bool) -> Tuple[List[str], List[str]]:
    reasons: List[str] = []
    warnings: List[str] = []
    name = float(scores.get("name", 0.0))
    vtype = float(scores.get("type", 0.0))
    overlap = float(scores.get("value_overlap", 0.0))
    emb = float(scores.get("embedding", 0.0))
    # name
    if name >= 0.85:
        reasons.append("High name similarity")
    elif 0.65 <= name < 0.85:
        reasons.append("Moderate name similarity")
    elif name < 0.50:
        warnings.append("Low name similarity")
    # type
    if vtype >= 1.0:
        reasons.append("Types compatible")
    else:
        warnings.append("Type mismatch")
    # overlap
    if overlap >= 0.50:
        reasons.append("High value overlap")
    elif 0.25 <= overlap < 0.50:
        reasons.append("Moderate value overlap")
    elif overlap < 0.15:
        warnings.append("Low value overlap")
    # embedding
    if embeddings_enabled and emb >= 0.60:
        reasons.append("Semantic match")
    return reasons, warnings


def suggest_mappings(left_df: pd.DataFrame, right_df: pd.DataFrame, sample_n: int = 1000, threshold: float | None = None) -> List[Dict]:
    left_cols = list(left_df.columns)
    right_cols = list(right_df.columns)

    le = _header_embeddings(left_cols)
    re = _header_embeddings(right_cols)

    out: List[Dict] = []
    for i, lc in enumerate(left_cols):
        for j, rc in enumerate(right_cols):
            name = _name_score(lc, rc)
            type_compat = 1.0 if _types_compatible(left_df[lc], right_df[rc]) else 0.5
            overlap, ex_a, ex_b = _value_overlap(left_df[lc], right_df[rc], sample_n=sample_n)
            emb = _cosine(le[i], re[j])

            conf = 0.45 * name + 0.20 * type_compat + 0.20 * overlap + 0.15 * emb
            thr = threshold if threshold is not None else settings.match_auto_threshold
            decision = "auto" if conf >= thr else "review"
            reasons, warnings = _reasons_and_warnings({
                "name": name,
                "type": type_compat,
                "value_overlap": overlap,
                "embedding": emb,
            }, settings.embeddings_enabled)

            out.append(
                {
                    "left_column": lc,
                    "right_column": rc,
                    "scores": {
                        "name": round(name, 6),
                        "type": round(type_compat, 6),
                        "value_overlap": round(overlap, 6),
                        "embedding": round(emb, 6),
                    },
                    "confidence": round(conf, 6),
                    "decision": decision,
                    "reasons": reasons,
                    "warnings": warnings,
                    "explain": {"left_examples": ex_a, "right_examples": ex_b},
                }
            )

    out.sort(key=lambda r: (r["left_column"].lower(), -r["confidence"]))
    return out


