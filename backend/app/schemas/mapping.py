from __future__ import annotations

from typing import Literal
from pydantic import BaseModel


class ApprovedMapping(BaseModel):
    candidateId: str
    fromDataset: Literal["bankA"]
    fromColumn: str
    toDataset: Literal["bankB"]
    toColumn: str


