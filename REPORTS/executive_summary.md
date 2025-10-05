# Executive Summary – EY DataFusion

## What this product does

DataFusion lets an analyst upload two banks’ datasets and automatically fuse them into a single, validated, well‑documented output. The system profiles data, auto‑pairs tables, proposes column mappings with clear reasons, previews the merged result with lineage, applies validation “gates,” and finally generates evidence‑grade documentation and artifacts. Secure Mode is on by default: sensitive examples are masked, and risky actions are disabled or gated.

## Why it matters

- Reduces risk: deterministic masking, validation gates, and a semantic “family gate” that prevents cross‑domain mistakes (e.g., Account ID ↔ Address Line).
- Improves speed: auto‑pairing and auto‑mapping lift the analyst from file wrangling to decision‑making; minutes‑saved and auto% are computed by the server for transparency.
- Repeatable evidence: run ledger, artifact hashes, and presigned links provide an auditable trail.

## How it works (plain English)

1. Upload two sets of files (Bank A, Bank B).
2. The system profiles each table (columns, types, samples, tags like email/phone/IBAN). Samples are masked in Secure Mode.
3. Auto‑pairing proposes table‑to‑table pairs (e.g., CurSav_Accounts ↔ Deposit_Accounts), with a score and reasons. You can accept all or adjust.
4. Column mapping suggests best matches with confidence, reasons, warnings, and masked examples; the slider is debounced and always reflects server truth.
5. Merge preview shows the combined table (optional entity‑resolution), sanitized for JSON, with a row limit cap from environment.
6. Validation runs business rules (e.g., required fields, format checks, outliers). If gates are triggered, Export is disabled and the UI points you back to the issues.
7. Docs/Artifacts generates markdown + normalized manifest JSON, attaches hashes, and (optionally) persists to S3/MinIO with expiring URLs.

```mermaid
flowchart LR
  A[Upload Files] --> B[Profile]
  B --> C[Auto-Pair Tables]
  C --> D[Suggest Mappings]
  D --> E[Merge + Lineage]
  E --> F[Validate (Gates)]
  F --> G[Export Docs + Artifacts]
```

## Security & compliance posture

- Secure‑by‑default: regulated_mode=true masks examples and disables embeddings by default.
- Redaction: logs include request and run IDs, not data; masking is deterministic and consistent.
- API hardening: optional API key, strict CORS (no wildcards by default), OpenAPI can be disabled in prod.
- Artifacts: presigned URLs with TTL; no public buckets by default.

## What works today

- Table and column profiling with semantic tagging and safe example masking.
- Auto‑pairing engine with transparent scoring; Accept‑All UI.
- Column‑level matching with deterministic reasons and minutes‑saved stats from the server.
- Semantic‑family gate that caps cross‑domain pairs and warns.
- Merge preview with limit caps and JSON sanitization; optional ER‑Lite pathway.
- Validation with gate flag that disables Export; UI deep‑links to violations.
- Docs/Artifacts with manifest hash; evidence bundle script; smoke script.
- Frontend/Backend env‑driven; MSW disabled unless explicitly enabled.

## What’s next (immediate)

- Tighten “family” inference on column names (avoid capping legit pairs like customer_id ↔ customer_number).
- Expand pairing to prefer entity‑bucket Hungarian matching (we ship greedy today, deterministic and adequate for demo).
- Add a quick smoke for /pair + Accept‑All → /match path; finalize demo presets.
- Optional: add Postgres DSN and MinIO env in docker‑compose for a one‑command demo stack.

## Demo readiness

The product is demo‑ready with the new Pairing step and Family Gate. A short checklist is included in this package to run tests, smoke, and a full walkthrough. Remaining adjustments are surgical (see roadmap_24h.md) and do not block the demo narrative.
