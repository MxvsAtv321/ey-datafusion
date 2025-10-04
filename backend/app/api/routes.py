from fastapi import APIRouter, Depends, UploadFile, File, Body
from typing import Dict, List
from ..core.security import require_api_key
from ..core.config import settings


router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"service": settings.service_name, "version": settings.version}


# Stubs for B1..B8
@router.post("/profile", dependencies=[Depends(require_api_key)])
async def profile(files: List[UploadFile] = File(...)):
    return {"profiles": {f.filename: {"table": f.filename} for f in files}}


@router.post("/match", dependencies=[Depends(require_api_key)])
async def match(files: List[UploadFile] = File(...)):
    return {"candidates": []}


@router.post("/merge", dependencies=[Depends(require_api_key)])
async def merge(files: List[UploadFile] = File(...), decisions: dict = Body(default={})):  # type: ignore[assignment]
    return {"columns": [], "preview_rows": []}


@router.post("/validate", dependencies=[Depends(require_api_key)])
async def validate(payload: dict = Body(...)):
    return {"status": "pass", "violations": [], "summary": {"rows": 0, "columns": 0, "warnings": 0}}


@router.post("/docs", dependencies=[Depends(require_api_key)])
async def docs(payload: dict = Body(...)):
    return {"markdown": "# Docs\n", "json": "{}"}


@router.post("/drift/check", dependencies=[Depends(require_api_key)])
async def drift_check(payload: dict = Body(...)):
    return {"added": [], "removed": [], "renamed": [], "type_changed": [], "nullrate_delta": [], "severity": "info"}


@router.post("/templates/save", dependencies=[Depends(require_api_key)])
async def templates_save(payload: dict = Body(...)):
    return {"template_id": "stub"}


@router.post("/templates/apply", dependencies=[Depends(require_api_key)])
async def templates_apply(payload: dict = Body(...)):
    return {"decisions": [], "notes": []}


@router.post("/runs/start", dependencies=[Depends(require_api_key)])
async def runs_start():
    return {"run_id": "stub-run", "started_at": "1970-01-01T00:00:00Z"}


@router.post("/runs/complete", dependencies=[Depends(require_api_key)])
async def runs_complete(payload: dict = Body(...)):
    return {"run_id": payload.get("run_id", "stub-run"), "status": payload.get("status", "ok"), "artifacts": []}


@router.get("/runs/{run_id}", dependencies=[Depends(require_api_key)])
async def runs_get(run_id: str):
    return {"run_id": run_id}


