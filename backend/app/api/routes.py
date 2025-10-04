from fastapi import APIRouter, Depends, UploadFile, File, Body
from typing import Dict, List
from ..core.security import require_api_key
from ..core.config import settings
from ..services.ingest import load_table, normalize_headers
from ..services.profile import profile_table
from ..schemas.profile import ProfileResponse
from ..services.match import suggest_mappings
from ..schemas.match import MatchResponse, CandidateMapping
from fastapi import HTTPException
from ..services.merge import merge_datasets
from ..schemas.merge import MappingDecision


router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"service": settings.service_name, "version": settings.version}


# Stubs for B1..B8
@router.post("/profile", response_model=ProfileResponse, dependencies=[Depends(require_api_key)])
async def profile(files: List[UploadFile] = File(...)):
    profiles: Dict[str, dict] = {}
    for f in files:
        content = await f.read()
        df = load_table(content, f.filename)
        df = normalize_headers(df)
        prof = profile_table(df, f.filename, settings.sample_n)
        profiles[f.filename] = prof.model_dump()
    return {"profiles": profiles}


@router.post("/match", response_model=MatchResponse, dependencies=[Depends(require_api_key)])
async def match(files: List[UploadFile] = File(...)):
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Provide exactly two files (left and right).")
    dfs = []
    for f in files:
        content = await f.read()
        df = load_table(content, f.filename)
        df = normalize_headers(df)
        dfs.append(df)
    left_df, right_df = dfs
    candidates = suggest_mappings(left_df, right_df, sample_n=settings.sample_n)
    return MatchResponse(candidates=[CandidateMapping.model_validate(c) for c in candidates])


@router.post("/merge", dependencies=[Depends(require_api_key)])
async def merge(files: List[UploadFile] = File(...), decisions: dict = Body(default={})):  # type: ignore[assignment]
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Provide exactly two files (left and right).")
    dfs = []
    for f in files:
        content = await f.read()
        df = load_table(content, f.filename)
        df = normalize_headers(df)
        dfs.append(df)
    left_df, right_df = dfs
    try:
        decisions_models = [MappingDecision.model_validate(d) for d in decisions or []]
    except Exception:
        decisions_models = []
    merged = merge_datasets({"left": left_df, "right": right_df}, decisions_models, lineage_meta={})
    preview = merged.head(50)
    return {"columns": list(preview.columns), "preview_rows": preview.to_dict(orient="records")}


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


