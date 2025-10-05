from __future__ import annotations

from pydantic import BaseModel


class MergedPreview(BaseModel):
    columns: list[str]
    rows: list[dict]  # values already normalized for preview


