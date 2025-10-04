from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

ScoreKey = Literal["name", "type", "value_overlap", "embedding"]


class CandidateMapping(BaseModel):
    left_column: str
    right_column: str
    scores: Dict[ScoreKey, float] = Field(
        ..., description="Per-signal scores in [0,1]"
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    decision: Literal["auto", "review"]
    explain: Optional[Dict[str, List[str]]] = Field(
        default=None,
        description="Sample values: {left_examples, right_examples}",
    )


class MatchResponse(BaseModel):
    candidates: List[CandidateMapping]
    threshold: float | None = None
    run_id: str | None = None


