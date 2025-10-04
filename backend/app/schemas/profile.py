from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class ColumnProfile(BaseModel):
    name: str
    dtype: str
    null_count: int
    unique_count_sampled: int
    candidate_primary_key_sampled: bool
    examples: List[str] = Field(default_factory=list)
    semantic_tags: List[str] = Field(default_factory=list)


class TableProfile(BaseModel):
    table: str
    rows: int
    columns: int
    sample_n: int
    columns_profile: List[ColumnProfile]


class ProfileResponse(BaseModel):
    profiles: Dict[str, TableProfile]
    examples_masked: bool | None = None



