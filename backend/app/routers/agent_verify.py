from __future__ import annotations

from fastapi import APIRouter
from ..schemas.run import AgentVerifyRequest
from ..schemas.agent import AgentReport, Confirmation, Diff, SchemaDiff, CellDiffs, Checks
from ..agent.driver import run_agent


router = APIRouter()


@router.post("/agent/verify", response_model=AgentReport)
async def agent_verify(payload: AgentVerifyRequest) -> AgentReport:
    """Load/compose inputs, call agent driver, return structured AgentReport. On any exception: SAFE_NO with reasons."""
    try:
        return await run_agent(payload)
    except Exception as e:
        return AgentReport(
            runId=payload.runId,
            confirmation=Confirmation(status="SAFE_NO", confidence=0.0, summary="Unhandled error"),
            diff=Diff(schema=SchemaDiff(), cells=CellDiffs(cellDiffRate=1.0, sampleSize=0)),
            checks=Checks(pipeline=payload.checksSummary or {}, agent={}),
            reasons=[f"Unhandled: {e}"],
            actionsTaken=[],
            limits=["router_exception"],
            timestamps={},
        )


