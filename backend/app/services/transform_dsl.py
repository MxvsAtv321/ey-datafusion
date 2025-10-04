from __future__ import annotations
import pandas as pd
from typing import List, Dict, Any
from app.schemas.merge import TransformOp


class TransformError(ValueError):
    ...


def validate_ops(ops: List[Dict[str, Any]]) -> List[TransformOp]:
    try:
        return [TransformOp.model_validate(op) for op in ops]
    except Exception as e:
        raise TransformError(str(e))


def apply_ops(df: pd.DataFrame, ops: List[TransformOp]) -> pd.DataFrame:
    out = df.copy()
    for op in ops:
        name = op.op
        args = op.args or {}
        if name == "strip":
            col = args.get("field");  assert col in out.columns, "strip.field missing/invalid"
            out[col] = out[col].astype(str).str.strip()
        elif name == "upper":
            col = args.get("field");  assert col in out.columns
            out[col] = out[col].astype(str).str.upper()
        elif name == "lower":
            col = args.get("field");  assert col in out.columns
            out[col] = out[col].astype(str).str.lower()
        elif name == "to_int":
            col = args.get("field");  assert col in out.columns
            out[col] = pd.to_numeric(out[col], errors="coerce").astype("Int64")
        elif name == "to_float":
            col = args.get("field");  assert col in out.columns
            out[col] = pd.to_numeric(out[col], errors="coerce")
        else:
            raise TransformError(f"Unsupported op in starter: {name}")
    return out


def format_chain(ops: List[TransformOp]) -> str:
    parts = []
    for op in ops:
        if op.args:
            parts.append(f"{op.op}({','.join(f'{k}={v}' for k,v in op.args.items())})")
        else:
            parts.append(op.op)
    return " | ".join(parts)


