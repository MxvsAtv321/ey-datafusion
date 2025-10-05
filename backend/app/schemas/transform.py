from __future__ import annotations

from typing import Literal
from pydantic import BaseModel


class TransformSpec(BaseModel):
    id: str
    targetColumn: str
    kind: Literal[
        "concat",
        "trim_spaces",
        "to_upper",
        "to_lower",
        "to_title",
        "cast_number",
        "cast_date",
    ]
    inputs: list[str] | None = None
    options: dict | None = None
    enabled: bool = True


