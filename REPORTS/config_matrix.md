# Config Matrix

| Env | Default | Description | Used at |
|---|---:|---|---|
| REGULATED_MODE | true | Secure defaults; masking on, embeddings off | backend/app/core/config.py |
| PROFILE_EXAMPLES_MASKED | true | Mask profile examples | profile.py, routes.py |
| EMBEDDINGS_ENABLED | false | Enable header embeddings (off in regulated) | match.py |
| MATCH_AUTO_THRESHOLD | 0.70 | Auto decision threshold | routes.py (/match) |
| MATCH_WEIGHT_NAME | 0.45 | Name signal weight | match.py |
| MATCH_WEIGHT_TYPE | 0.20 | Type compatibility weight | match.py |
| MATCH_WEIGHT_OVERLAP | 0.20 | Value overlap weight | match.py |
| MATCH_WEIGHT_EMBED | 0.15 | Embedding weight | match.py |
| S3_PRESIGN_TTL | 3600 | Presigned URL TTL | storage.py |
| DRIFT_WARN_DELTA | 0.15 | Drift warning bound | drift.py |
| DRIFT_CRIT_DELTA | 0.30 | Drift critical bound | drift.py |
| MERGE_PREVIEW_DEFAULT | 50 | Default preview rows | routes.py (/merge) |
| MERGE_PREVIEW_MAX | 500 | Preview max cap | routes.py (/merge) |
| PK_UNIQUE_RATIO | 0.99 | PK heuristic ratio | profile.py |
| OUTLIER_IQR_K | 1.5 | IQR multiplier | validate.py |
| OUTLIER_Z | 3.0 | Z-score threshold | validate.py |
| ALLOWED_ORIGINS | (empty) | CORS whitelist | main.py |
| DISABLE_OPENAPI | false | Disable OpenAPI in prod | main.py |
| API_KEY | (unset) | Enforce API‑key when set | core/security.py |
| TABLEPAIR_W_NAME | 0.35 | Pairing weight: name | table_pairing.py |
| TABLEPAIR_W_TAGS | 0.25 | Pairing weight: semantic tags | table_pairing.py |
| TABLEPAIR_W_DTYPE | 0.20 | Pairing weight: dtype histogram | table_pairing.py |
| TABLEPAIR_W_ROWS | 0.10 | Pairing weight: row ratio | table_pairing.py |
| TABLEPAIR_W_KEYS | 0.10 | Pairing weight: PK | table_pairing.py |
| TABLEPAIR_W_ENTITY | 0.10 | Pairing weight: entity bonus | table_pairing.py |
| TABLEPAIR_MIN_SCORE | 0.35 | Minimum viable pair score | table_pairing.py |
| TABLEPAIR_AUTO_THRESHOLD_PCT | 0.75 | Auto pair threshold | table_pairing.py |
| FAMILY_GATE_ENABLED | true | Enable cross‑family cap in column matching | match.py |
| FAMILY_GATE_CAP | 0.49 | Cap for cross‑family pairs | match.py |
