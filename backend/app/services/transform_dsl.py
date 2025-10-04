from __future__ import annotations
import re
import pandas as pd
from typing import List, Dict, Any
from app.schemas.merge import TransformOp


class TransformError(ValueError):
    ...


_ALLOWED = {
    "strip", "upper", "lower",
    "to_int", "to_float", "to_datetime",
    "concat", "split", "regex_extract", "map_values", "fx_to",
}


def _require_args(op: Dict[str, Any], keys: List[str], idx: int) -> None:
    args = op.get("args") or {}
    for k in keys:
        if k not in args:
            raise TransformError(f"ops[{idx}].args.{k} is required for {op.get('op')}")


def validate_ops(ops: List[Dict[str, Any]]) -> List[TransformOp]:
    if not isinstance(ops, list):
        raise TransformError("ops must be a list")
    for i, raw in enumerate(ops):
        if not isinstance(raw, dict):
            raise TransformError(f"ops[{i}] must be an object")
        name = raw.get("op")
        if name not in _ALLOWED:
            raise TransformError(f"ops[{i}].op unsupported: {name}")
        # Required args by op
        if name in {"to_int", "to_float", "to_datetime", "split", "regex_extract", "map_values"}:
            _require_args(raw, ["field"], i)
        if name == "to_datetime":
            # fmt is optional; pandas can infer
            pass
        if name == "concat":
            _require_args(raw, ["fields"], i)
            args = raw.get("args") or {}
            if not isinstance(args.get("fields"), list) or not args.get("fields"):
                raise TransformError(f"ops[{i}].args.fields must be a non-empty list")
        if name == "regex_extract":
            _require_args(raw, ["pattern", "group"], i)
        if name == "map_values":
            _require_args(raw, ["mapping"], i)
    # Validate against Pydantic after shape checks
    try:
        return [TransformOp.model_validate(op) for op in ops]
    except Exception as e:
        raise TransformError(str(e))


def _apply_string_op_all(out: pd.DataFrame, func_name: str, field: str | None) -> pd.DataFrame:
    if field:
        if field not in out.columns:
            raise TransformError(f"field not found: {field}")
        out[field] = out[field].astype(str).str.__getattr__(func_name)()
        return out
    # apply to all object columns
    for c in out.columns:
        if pd.api.types.is_object_dtype(out[c]) or pd.api.types.is_string_dtype(out[c]):
            out[c] = out[c].astype(str).str.__getattr__(func_name)()
    return out


def apply_ops(df: pd.DataFrame, ops: List[TransformOp]) -> pd.DataFrame:
    out = df.copy()
    for op in ops:
        name = op.op
        args = op.args or {}
        if name == "strip":
            out = _apply_string_op_all(out, "strip", args.get("field"))
        elif name == "upper":
            out = _apply_string_op_all(out, "upper", args.get("field"))
        elif name == "lower":
            out = _apply_string_op_all(out, "lower", args.get("field"))
        elif name == "to_int":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("to_int.field missing/invalid")
            out[col] = pd.to_numeric(out[col], errors="coerce").astype("Int64")
        elif name == "to_float":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("to_float.field missing/invalid")
            out[col] = pd.to_numeric(out[col], errors="coerce")
        elif name == "to_datetime":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("to_datetime.field missing/invalid")
            fmt = args.get("fmt")
            out[col] = pd.to_datetime(out[col], errors="coerce", format=fmt)
        elif name == "concat":
            fields = args.get("fields") or []
            sep = args.get("sep", " ")
            target = args.get("target", "concat")
            for f in fields:
                if f not in out.columns:
                    raise TransformError(f"concat field not found: {f}")
            out[target] = out[fields].astype(str).agg(sep.join, axis=1)
        elif name == "split":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("split.field missing/invalid")
            sep = args.get("sep", ",")
            idx = int(args.get("index", 0))
            target = args.get("target") or f"{col}_part{idx}"
            out[target] = out[col].astype(str).str.split(sep).str.get(idx)
        elif name == "regex_extract":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("regex_extract.field missing/invalid")
            pattern = args.get("pattern")
            group = int(args.get("group", 0))
            target = args.get("target") or f"{col}_re{group}"
            out[target] = out[col].astype(str).str.extract(re.compile(pattern), expand=False).astype(str).str.strip()
        elif name == "map_values":
            col = args.get("field")
            if col not in out.columns:
                raise TransformError("map_values.field missing/invalid")
            mapping = args.get("mapping") or {}
            out[col] = out[col].map(mapping).fillna(out[col])
        elif name == "fx_to":
            # stub: return amount as-is into fx_amount (or target field if provided)
            amount_field = args.get("amount_field")
            target_ccy = args.get("target", "FX")
            if amount_field not in out.columns:
                raise TransformError("fx_to.amount_field missing/invalid")
            target = args.get("target_field") or "fx_amount"
            out[target] = pd.to_numeric(out[amount_field], errors="coerce")
        else:
            raise TransformError(f"Unsupported op: {name}")
    return out


def format_chain(ops: List[TransformOp]) -> str:
    parts = []
    for op in ops:
        if op.args:
            parts.append(f"{op.op}({','.join(f'{k}={v}' for k,v in op.args.items())})")
        else:
            parts.append(op.op)
    return " | ".join(parts)


