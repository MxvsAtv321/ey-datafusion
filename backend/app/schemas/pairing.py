from __future__ import annotations

from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from .profile import TableProfile


class PairingSide(BaseModel):
    tables: List[TableProfile] = Field(default_factory=list)


class PairingSettings(BaseModel):
    weights: Dict[str, float]
    min_score: float


class PairSuggestion(BaseModel):
    left_table: str
    right_table: str
    score: float
    decision: str  # "auto" | "review"
    entity_type: str
    reasons: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class PairingMatrix(BaseModel):
    left: List[str]
    right: List[str]
    scores: List[List[float]]


class PairRequest(BaseModel):
    left: PairingSide
    right: PairingSide
    min_score: Optional[float] = None
    mode: Optional[str] = None  # "strict" | "balanced" | "lenient"


class PairResponse(BaseModel):
    settings: PairingSettings
    pairs: List[PairSuggestion]
    unpaired_left: List[str] = Field(default_factory=list)
    unpaired_right: List[str] = Field(default_factory=list)
    matrix: Optional[PairingMatrix] = None


