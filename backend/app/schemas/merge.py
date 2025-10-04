from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Any


class TransformOp(BaseModel):
    op: Literal["strip", "upper", "lower", "to_int", "to_float", "to_datetime", "concat", "split", "regex_extract", "map_values", "fx_to"]
    args: Dict[str, Any] | None = None


class MappingDecision(BaseModel):
    left_table: str
    left_column: str
    right_table: str
    right_column: str
    decision: Literal["accept","reject","manual","auto"]
    confidence: float
    transform_ops: List[TransformOp] | None = None


