from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, condecimal, constr


class Confirmation(BaseModel):
    status: Literal["SAFE_YES", "SAFE_NO"]
    confidence: condecimal(ge=0, le=1, max_digits=3, decimal_places=2) | float
    summary: constr(strip_whitespace=True, min_length=3, max_length=240)


class SchemaDiff(BaseModel):
    missingInAgent: list[str] = []
    missingInPipeline: list[str] = []
    typeMismatches: list[dict] = []  # {column, pipelineType, agentType}


class CellExample(BaseModel):
    column: str
    rowIndex: int
    pipelineHash: str
    agentHash: str
    pipelineExampleMasked: str
    agentExampleMasked: str


class CellDiffs(BaseModel):
    cellDiffRate: condecimal(ge=0, le=1) | float
    sampleSize: int
    byColumn: list[dict] = []  # {column, diffRate}
    examples: list[CellExample] = []


class Diff(BaseModel):
    schema: SchemaDiff
    cells: CellDiffs


class Checks(BaseModel):
    pipeline: dict[str, int] = {}
    agent: dict[str, int] = {}


class AgentReport(BaseModel):
    runId: str
    confirmation: Confirmation
    diff: Diff
    checks: Checks
    reasons: list[str]
    actionsTaken: list[str]
    limits: list[str]
    timestamps: dict  # {startedAt, endedAt}


