from fastapi import APIRouter, Depends, UploadFile, File, Body, Form, Query, Request
import pandas as pd
from typing import Dict, List
from ..core.security import require_api_key
from ..core.config import settings
from ..services.ingest import load_table, normalize_headers
from ..services.profile import profile_table
from ..schemas.profile import ProfileResponse
from ..services.match import suggest_mappings
from ..schemas.match import MatchResponse, CandidateMapping
from fastapi import HTTPException
from ..services.merge import merge_datasets, er_lite_customers
from ..schemas.merge import MappingDecision
from ..services.validate import run_validation
from ..schemas.validate import ValidateResponse
from ..services.docs import generate_docs
from ..services.db import add_input_files, save_manifest, add_artifacts
from ..services.db import create_run, complete_run, get_run
from ..services.templates import save_template, apply_template
from ..services.drift import drift_between
from ..services.copilot import triage as copilot_triage, fixit as copilot_fixit


router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"service": settings.service_name, "version": settings.version}


# Stubs for B1..B8
@router.post("/profile", response_model=ProfileResponse, dependencies=[Depends(require_api_key)])
async def profile(request: Request, files: List[UploadFile] = File(...)):
    profiles: Dict[str, dict] = {}
    # capture simple file hashes when possible (size only here; names recorded)
    import hashlib
    inputs_meta: list[dict] = []
    for f in files:
        content = await f.read()
        df = load_table(content, f.filename)
        df = normalize_headers(df)
        prof = profile_table(df, f.filename, settings.sample_n)
        profiles[f.filename] = prof.model_dump()
        h = hashlib.sha256(content).hexdigest()
        inputs_meta.append({"name": f.filename, "size": len(content), "sha256": f"sha256:{h}"})
    add_input_files(getattr(request.state, "run_id", None), inputs_meta)
    return {"profiles": profiles}


@router.post("/match", response_model=MatchResponse, dependencies=[Depends(require_api_key)])
async def match(request: Request, files: List[UploadFile] = File(...)):
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
    # mark best pick per left
    best_by_left: dict[str, float] = {}
    for c in candidates:
        key = c["left_column"]
        best_by_left[key] = max(best_by_left.get(key, 0.0), c["confidence"])
    # echo run and threshold
    run_id = getattr(request.state, "run_id", None)
    resp = MatchResponse(
        candidates=[CandidateMapping.model_validate(c) for c in candidates],
        threshold=settings.match_auto_threshold,
        run_id=run_id,
    )
    # Fast path: we cannot set best_pick on model, but frontend can infer by max confidence per left
    return resp


@router.post("/merge", dependencies=[Depends(require_api_key)])
async def merge(request: Request, files: List[UploadFile] = File(...), decisions: str | None = Form(default=None), limit: int = Query(default=50, ge=1, le=500), entity_resolution: str | None = Query(default=None)):
    if len(files) != 2:
        raise HTTPException(status_code=400, detail="Provide exactly two files (left and right).")
    dfs = []
    for f in files:
        content = await f.read()
        df = load_table(content, f.filename)
        df = normalize_headers(df)
        dfs.append(df)
    left_df, right_df = dfs
    import json
    try:
        raw = json.loads(decisions or "[]")
        decisions_models = [MappingDecision.model_validate(d) for d in raw or []]
    except Exception:
        decisions_models = []
    merged = merge_datasets({"left": left_df, "right": right_df}, decisions_models, lineage_meta={})
    er_stats = None
    if entity_resolution == "customers_v1":
        merged, er_stats = er_lite_customers(merged)
    preview = merged.head(limit)
    resp = {"columns": list(preview.columns), "preview_rows": preview.to_dict(orient="records"), "run_id": getattr(request.state, "run_id", None)}
    if er_stats:
        resp["er_stats"] = er_stats
    return resp


@router.post("/validate", response_model=ValidateResponse, dependencies=[Depends(require_api_key)])
async def validate(request: Request, payload: dict = Body(...)):
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="Expect rows: list")
    df = pd.DataFrame(rows)
    contract = payload.get("contract", "customers")
    result = run_validation(df, contract, aux_tables=None)
    # add gate flag
    gate = False
    if settings.required_rules:
        # naive: gate if any required rule appears as error
        req = set(settings.required_rules)
        for v in result.violations:
            if v.severity == "error" and any(v.rule.startswith(r) for r in req):
                gate = True
                break
    result.gate_blocked = gate
    result.run_id = getattr(request.state, "run_id", None)
    return result


@router.post("/docs", dependencies=[Depends(require_api_key)])
async def docs(request: Request, payload: dict = Body(...)):
    manifest = payload.get("mapping", {})
    run_id = payload.get("run_id", "")
    threshold = float(payload.get("threshold", settings.match_auto_threshold))
    # compute markdown and manifest hash
    import hashlib, json as pyjson
    md, js = generate_docs(manifest, run_id, threshold)
    normalized = pyjson.dumps(manifest, sort_keys=True)
    mh = f"sha256:{hashlib.sha256(normalized.encode('utf-8')).hexdigest()}"
    save_manifest(run_id, threshold, normalized, mh)
    # optional: write to S3 if configured
    from ..services.storage import put_object, presigned_url
    artifacts = []
    try:
        key_md = f"runs/{run_id}/docs.md" if run_id else "docs.md"
        key_json = f"runs/{run_id}/manifest.json" if run_id else "manifest.json"
        u1 = put_object(key_md, md.encode("utf-8"), content_type="text/markdown")
        u2 = put_object(key_json, normalized.encode("utf-8"), content_type="application/json")
        artifacts = [
            {"name": "docs.md", "url": presigned_url(key_md), "sha256": f"sha256:{hashlib.sha256(md.encode('utf-8')).hexdigest()}"},
            {"name": "manifest.json", "url": presigned_url(key_json), "sha256": f"sha256:{hashlib.sha256(normalized.encode('utf-8')).hexdigest()}"}
        ]
        add_artifacts(run_id, artifacts)
    except Exception:
        artifacts = []
    return {"markdown": md, "json": normalized, "run_id": run_id, "manifest_hash": mh, "artifacts": artifacts}


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
    import uuid
    run_id = str(uuid.uuid4())
    return create_run(run_id)


@router.post("/runs/complete", dependencies=[Depends(require_api_key)])
async def runs_complete(payload: dict = Body(...)):
    run_id = payload.get("run_id")
    status = payload.get("status", "ok")
    artifacts = payload.get("artifacts", [])
    return complete_run(run_id, status, artifacts)


@router.get("/runs/{run_id}", dependencies=[Depends(require_api_key)])
async def runs_get(run_id: str):
    data = get_run(run_id)
    return data or {"run_id": run_id, "status": "unknown"}


@router.post("/copilot/triage", dependencies=[Depends(require_api_key)])
async def copilot_triage_endpoint(payload: dict = Body(...)):
    profiles = payload.get("profiles", {})
    candidates = payload.get("candidates")
    target_precision = payload.get("target_precision")
    return copilot_triage(profiles, candidates, target_precision)


@router.post("/copilot/fixit", dependencies=[Depends(require_api_key)])
async def copilot_fixit_endpoint(payload: dict = Body(...)):
    validate_result = payload.get("validate_result", {})
    return copilot_fixit(validate_result)


