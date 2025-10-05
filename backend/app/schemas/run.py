from __future__ import annotations

from pydantic import BaseModel
from typing import Literal

from .mapping import ApprovedMapping
from .transform import TransformSpec
from .preview import MergedPreview


class AgentVerifyRequest(BaseModel):
    runId: str
    approvedMappings: list[ApprovedMapping]
    transforms: list[TransformSpec]
    pipelinePreview: MergedPreview | None = None
    checksSummary: dict[str, int] | None = None
    secureMode: bool = True


