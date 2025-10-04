#!/usr/bin/env python3
import argparse, json, os, pathlib, urllib.request, zipfile, datetime


def fetch_json(url: str):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read().decode("utf-8"))


def download(url: str, dest: pathlib.Path):
    with urllib.request.urlopen(url) as r, open(dest, "wb") as f:
        f.write(r.read())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--run-id", required=True)
    p.add_argument("--base", default=os.environ.get("BASE", "http://localhost:8000"))
    args = p.parse_args()

    base = args.base.rstrip("/")
    run = fetch_json(f"{base}/api/v1/runs/{args.run_id}")

    out_dir = pathlib.Path("deliverables") / args.run_id
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "run.json").write_text(json.dumps(run, indent=2), encoding="utf-8")

    arts = run.get("artifacts", [])
    for a in arts:
        name = a.get("name", "artifact.bin")
        url = a.get("url")
        if not url:
            continue
        dest = out_dir / name
        try:
            download(url, dest)
        except Exception as e:
            (out_dir / f"{name}.error.txt").write_text(str(e), encoding="utf-8")

    tm = f"""# THREAT_MODEL

Generated: {datetime.datetime.utcnow().isoformat()}Z
- Regulated Mode: backend masks examples, embeddings disabled, API-key required (if set), strict CORS
- Logs: PII redaction formatter enabled
- Artifacts: presigned URLs with TTL; SHA256 recorded in run ledger
- Reproducibility: manifest_hash present in docs response; input hashes stored in run
"""
    (out_dir / "THREAT_MODEL.md").write_text(tm, encoding="utf-8")

    zip_path = pathlib.Path("deliverables") / f"{args.run_id}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for pth in out_dir.rglob("*"):
            z.write(pth, pth.relative_to("deliverables"))
    print(f"Evidence ZIP written to {zip_path}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import io
import json
import os
import zipfile
from datetime import datetime, timezone

import sqlalchemy

from app.services.db import get_run


def main():
    ap = argparse.ArgumentParser(description="Build evidence bundle for a run_id")
    ap.add_argument("run_id", help="Run ID")
    ap.add_argument("--out", default="deliverables", help="Output directory")
    args = ap.parse_args()

    run = get_run(args.run_id)
    if not run:
        raise SystemExit(f"run not found: {args.run_id}")

    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)
    bundle_name = os.path.join(out_dir, f"{args.run_id}.zip")

    with zipfile.ZipFile(bundle_name, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("run.json", json.dumps(run, indent=2, sort_keys=True))
        # Include pointers to artifacts and manifest hash
        meta = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "manifest_hash": run.get("manifest_hash"),
            "artifacts": run.get("artifacts", []),
            "input_files": run.get("input_files", []),
        }
        zf.writestr("bundle.json", json.dumps(meta, indent=2, sort_keys=True))
        # Minimal threat model stub; see THREAT_MODEL.md in repo root
        zf.writestr("THREAT_MODEL.md", THREAT_MODEL)

    print(f"wrote {bundle_name}")


THREAT_MODEL = """# Threat Model (DataFusion)

Trust Boundaries:
- Browser → FastAPI (API key; CORS-restricted; OpenAPI disabled in prod)
- FastAPI → DB (ledger), FastAPI → S3/MinIO (artifacts)

Controls:
- Regulated Mode defaults; embeddings disabled
- Masking in /match explain (email/phone/iban)
- Log redaction for PII patterns in JSON logs
- Artifacts stored in S3 with presigned URLs and hashes
- Runs ledger stores input file hashes and manifest hash

Assumptions:
- No outbound egress beyond DB/S3
- Debug disabled in production; tracebacks not exposed
"""


if __name__ == "__main__":
    main()


