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
from ..services.validate import run_validation
from ..schemas.validate import ValidateResponse
from ..services.docs import generate_docs
from ..services.templates import save_template, apply_template
from ..services.drift import drift_between


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


@router.post("/validate", response_model=ValidateResponse, dependencies=[Depends(require_api_key)])
async def validate(payload: dict = Body(...)):
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="Expect rows: list")
    df = pd.DataFrame(rows)
    contract = payload.get("contract", "customers")
    result = run_validation(df, contract, aux_tables=None)
    return result


@router.post("/docs", dependencies=[Depends(require_api_key)])
async def docs(payload: dict = Body(...)):
    manifest = payload.get("mapping", {})
    run_id = payload.get("run_id", "")
    threshold = float(payload.get("threshold", settings.match_auto_threshold))
    md, js = generate_docs(manifest, run_id, threshold)
    return {"markdown": md, "json": js}


@router.post("/drift/check", dependencies=[Depends(require_api_key)])
async def drift_check(payload: dict = Body(...)):
    baseline = payload.get("baseline", {})
    current = payload.get("current", {})
    return drift_between(baseline, current)


@router.post("/templates/save", dependencies=[Depends(require_api_key)])
async def templates_save(payload: dict = Body(...)):
    name = payload.get("name", "default")
    manifest = payload.get("manifest", {})
    snapshot = payload.get("profile_snapshot", {})
    tid = save_template(name, manifest, snapshot)
    return {"template_id": tid}


@router.post("/templates/apply", dependencies=[Depends(require_api_key)])
async def templates_apply(payload: dict = Body(...)):
    name = payload.get("name", "default")
    current = payload.get("current_profile", {})
    return apply_template(name, current)


@router.post("/runs/start", dependencies=[Depends(require_api_key)])
async def runs_start():
    return {"run_id": "stub-run", "started_at": "1970-01-01T00:00:00Z"}


@router.post("/runs/complete", dependencies=[Depends(require_api_key)])
async def runs_complete(payload: dict = Body(...)):
    return {"run_id": payload.get("run_id", "stub-run"), "status": payload.get("status", "ok"), "artifacts": []}


@router.get("/runs/{run_id}", dependencies=[Depends(require_api_key)])
async def runs_get(run_id: str):
    return {"run_id": run_id}


