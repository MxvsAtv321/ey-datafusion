from __future__ import annotations
from typing import List, Dict, Tuple
import math
import pandas as pd
from app.core.config import settings

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
    if sa == sb:
        return True
    family = {"integer", "number", "boolean", "datetime", "string"}
    return sa in family and sb in family


def _name_score(a: str, b: str) -> float:
    if not fuzz:
        return 1.0 if a.lower() == b.lower() else 0.0
    return max(fuzz.token_sort_ratio(a, b), fuzz.partial_ratio(a, b)) / 100.0


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
    return jacc, _mask_examples(ex_a), _mask_examples(ex_b)


def _mask_examples(values: List[str]) -> List[str]:
    if not settings.regulated_mode:
        return values
    import re
    masked = []
    for v in values:
        # email
        if re.fullmatch(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", v or ""):
            masked.append(re.sub(r"([A-Za-z0-9._%+-]).*@.*", r"\1***@***.com", v))
            continue
        # phone keep last 4
        m = re.search(r"(\d{4})$", re.sub(r"\D", "", v or ""))
        if m and len(re.sub(r"\D", "", v)) >= 7:
            masked.append(f"***-***-{m.group(1)}")
            continue
        # IBAN last4
        if re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{1,30}", v or "", flags=re.I):
            masked.append("****" + (v[-4:] if len(v) >= 4 else v))
            continue
        masked.append((v or "")[:12])
    return masked


def suggest_mappings(left_df: pd.DataFrame, right_df: pd.DataFrame, sample_n: int = 1000) -> List[Dict]:
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
            decision = "auto" if conf >= settings.match_auto_threshold else "review"

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
                    "explain": {"left_examples": ex_a, "right_examples": ex_b},
                }
            )

    out.sort(key=lambda r: (r["left_column"].lower(), -r["confidence"]))
    return out


