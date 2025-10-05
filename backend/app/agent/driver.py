from __future__ import annotations

import asyncio
import json
import os
import pathlib
import time
from typing import Any, Callable, Awaitable

from ..config import CELL_DIFF_THRESHOLD, REQUEST_TIMEOUT_S, SAMPLE_SIZE, SECURE_MODE_DEFAULT
from ..schemas.agent import AgentReport, Confirmation, Diff, SchemaDiff, CellDiffs, Checks, CellExample
from ..schemas.run import AgentVerifyRequest
from ..utils.hash import sha256_hex
from ..utils.mask import mask_value
from ..tools.profile_tool import profile as tool_profile
from ..tools.merge_tool import merge as tool_merge
from ..tools.preview_tool import preview_pipeline as tool_preview
from ..tools.compare_tool import compare as tool_compare
from .llm_client import build_client_from_env


_PROMPT_PATH = pathlib.Path(__file__).with_name("system_prompt.txt")


async def _guard(name: str, fn: Callable[..., Awaitable[Any]], *args, **kwargs) -> tuple[bool, Any, str | None]:
    async def _once():
        return await asyncio.wait_for(fn(*args, **kwargs), timeout=REQUEST_TIMEOUT_S)

    for attempt in range(2):
        try:
            res = await _once()
            return True, res, None
        except Exception as e:
            last_err = f"{name} failed: {e}"
            await asyncio.sleep(0)
    return False, None, last_err


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


async def run_agent(payload: AgentVerifyRequest) -> AgentReport:
    started = _now_iso()
    limits: list[str] = []
    actions: list[str] = []
    reasons: list[str] = []
    secure = bool(payload.secureMode if payload.secureMode is not None else SECURE_MODE_DEFAULT)

    # Load prompt text
    try:
        prompt_text = _PROMPT_PATH.read_text(encoding="utf-8")
    except Exception:
        prompt_text = ""

    # LLM path (Gemini) – default ON unless explicitly disabled
    use_llm = os.getenv("AGENT_USE_LLM", "true").lower() in ("1", "true", "yes")
    if use_llm:
        client = build_client_from_env()
        if client is None:
            # attempt to load root .env automatically
            try:
                from dotenv import load_dotenv
                root_env = pathlib.Path(__file__).resolve().parents[4] / ".env"
                if root_env.exists():
                    load_dotenv(dotenv_path=str(root_env))
                    client = build_client_from_env()
            except Exception:
                pass
        if client is None:
            limits.append("llm_disabled_missing_api_key")
        else:
            try:
                user_payload = {
                    "runId": payload.runId,
                    "approvedMappings": [m.model_dump() for m in payload.approvedMappings],
                    "transforms": [t.model_dump() for t in payload.transforms],
                    "pipelinePreview": (payload.pipelinePreview.model_dump() if payload.pipelinePreview else None),
                    "checksSummary": payload.checksSummary or {},
                    "secureMode": secure,
                    "thresholds": {
                        "cellDiff": CELL_DIFF_THRESHOLD,
                        "sample": SAMPLE_SIZE,
                    },
                }
                llm_json = client.generate_agent_report(prompt_text, user_payload, timeout_s=REQUEST_TIMEOUT_S)
                # Validate and enforce thresholds
                try:
                    candidate = AgentReport.model_validate(llm_json)
                except Exception as e:
                    raise RuntimeError(f"llm_validation_failed: {e}")
                # Enforce thresholds
                schema_missing = len(candidate.diff.schema.missingInAgent) + len(candidate.diff.schema.missingInPipeline)
                has_type_mismatch = 1 if candidate.diff.schema.typeMismatches else 0
                diff_rate = float(candidate.diff.cells.cellDiffRate)
                safe = schema_missing == 0 and has_type_mismatch == 0 and diff_rate <= CELL_DIFF_THRESHOLD
                if not safe and candidate.confirmation.status == "SAFE_YES":
                    # downgrade
                    candidate.confirmation.status = "SAFE_NO"
                    reasons = list(candidate.reasons)
                    if schema_missing:
                        reasons.append("Schema columns mismatch")
                    if has_type_mismatch:
                        reasons.append("Column type mismatches detected")
                    if diff_rate > CELL_DIFF_THRESHOLD:
                        reasons.append("Cell difference rate exceeds threshold")
                    candidate.reasons = reasons
                # Clamp confidence
                confidence = max(0.0, 1.0 - (diff_rate * 50.0) - (0.5 if has_type_mismatch else 0.0) - (0.5 if schema_missing > 0 else 0.0))
                candidate.confirmation.confidence = round(confidence, 2)
                # timestamps
                ended = _now_iso()
                candidate.timestamps = {"startedAt": started, "endedAt": ended}
                # return validated candidate
                try:
                    return AgentReport.model_validate_json(candidate.model_dump_json())
                except Exception:
                    # If double validation fails, fall through to deterministic path
                    limits.append("llm_double_validation_failed")
            except Exception as e:
                limits.append(f"llm_failure:{e}")

    # Deterministic path
    # Get pipeline preview (use provided or fetch)
    pipeline = payload.pipelinePreview.model_dump() if payload.pipelinePreview else None
    if pipeline is None:
        ok, result, err = await _guard("previewPipeline", tool_preview, payload.runId)
        if not ok:
            limits.append(err or "preview unavailable")
            pipeline = {"columns": [], "rows": []}
        else:
            pipeline = result
        actions.append("preview_pipeline")

    # Compute agent merge deterministically
    ok, agent_merge, err = await _guard(
        "merge", tool_merge, payload.approvedMappings, payload.transforms, sample_size=SAMPLE_SIZE
    )
    if not ok:
        limits.append(err or "merge failed")
        agent_merge = {"columns": [], "rows": []}
    actions.append("merge")

    # Compare
    ok, cmp, err = await _guard("compare", tool_compare, agent_merge, pipeline, options=None)
    if not ok:
        limits.append(err or "compare failed")
        cmp = {"columnDiffs": {"missingInA": [], "missingInB": [], "typeMismatches": []}, "rowStats": {"compared": 0}, "cellDiffRate": 1.0, "examples": [], "commonColumns": []}
    actions.append("compare")

    # Build Diff
    schema_diff = SchemaDiff(
        missingInAgent=cmp["columnDiffs"].get("missingInA", []),
        missingInPipeline=cmp["columnDiffs"].get("missingInB", []),
        typeMismatches=cmp["columnDiffs"].get("typeMismatches", []),
    )
    sample_size = int(cmp.get("rowStats", {}).get("compared", 0))
    by_column = cmp.get("commonColumns", [])
    by_col_rates = cmp.get("columnDiffsByCol", None)
    if by_col_rates is None:
        # derive from examples and counts if absent
        by_col_rates = cmp.get("byColumn") or []
        if not by_col_rates and by_column and sample_size:
            by_col_rates = [{"column": c, "diffRate": 0.0} for c in by_column]
    # mask examples
    examples: list[CellExample] = []
    for ex in cmp.get("examples", [])[:3]:
        col = ex.get("column", "")
        idx = int(ex.get("rowIndex", 0))
        a_val = ex.get("aValue")
        b_val = ex.get("bValue")
        examples.append(
            CellExample(
                column=col,
                rowIndex=idx,
                pipelineHash=sha256_hex(b_val),
                agentHash=sha256_hex(a_val),
                pipelineExampleMasked=(mask_value(b_val) if secure else str(b_val)),
                agentExampleMasked=(mask_value(a_val) if secure else str(a_val)),
            )
        )
    cells = CellDiffs(cellDiffRate=float(cmp.get("cellDiffRate", 1.0)), sampleSize=sample_size, byColumn=by_col_rates or [], examples=examples)
    diff = Diff(schema=schema_diff, cells=cells)

    # Thresholds and confirmation
    schema_missing = (len(schema_diff.missingInAgent) + len(schema_diff.missingInPipeline))
    has_type_mismatch = 1 if schema_diff.typeMismatches else 0
    diff_rate = float(cells.cellDiffRate)
    safe = schema_missing == 0 and has_type_mismatch == 0 and diff_rate <= CELL_DIFF_THRESHOLD
    status = "SAFE_YES" if safe else "SAFE_NO"
    # confidence
    confidence = max(0.0, 1.0 - (diff_rate * 50.0) - (0.5 if has_type_mismatch else 0.0) - (0.5 if schema_missing > 0 else 0.0))

    if not safe:
        if schema_missing:
            reasons.append("Schema columns mismatch")
        if has_type_mismatch:
            reasons.append("Column type mismatches detected")
        if diff_rate > CELL_DIFF_THRESHOLD:
            reasons.append("Cell difference rate exceeds threshold")

    confirmation = Confirmation(status=status, confidence=round(confidence, 2), summary=("Match within tolerance" if safe else "Differences exceed tolerance"))

    ended = _now_iso()
    report = AgentReport(
        runId=payload.runId,
        confirmation=confirmation,
        diff=diff,
        checks=Checks(pipeline=payload.checksSummary or {}, agent={}),
        reasons=reasons,
        actionsTaken=actions,
        limits=limits,
        timestamps={"startedAt": started, "endedAt": ended},
    )
    # Final validation
    try:
        return AgentReport.model_validate_json(report.model_dump_json())
    except Exception:
        # On validation error, return SAFE_NO minimal structure
        return AgentReport(
            runId=payload.runId,
            confirmation=Confirmation(status="SAFE_NO", confidence=0.0, summary="Validation failed"),
            diff=Diff(schema=SchemaDiff(), cells=CellDiffs(cellDiffRate=1.0, sampleSize=0)),
            checks=Checks(pipeline=payload.checksSummary or {}, agent={}),
            reasons=["Validation failed"],
            actionsTaken=actions,
            limits=limits + ["validation_error"],
            timestamps={"startedAt": started, "endedAt": ended},
        )


