from __future__ import annotations
from pydantic import BaseModel
from typing import List, Literal


class ValidationViolation(BaseModel):
    rule: str
    severity: Literal["error", "warning"]
    count: int
    sample: List[int]


class ValidateSummary(BaseModel):
    rows: int
    columns: int
    warnings: int


class ValidateResponse(BaseModel):
    status: Literal["pass", "fail"]
    violations: List[ValidationViolation]
    summary: ValidateSummary
    gate_blocked: bool | None = None
    run_id: str | None = None


