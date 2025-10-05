#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:8000}
RUN=${RUN:-demo-run}
B1=${B1:-sample/bank1.csv}
B2=${B2:-sample/bank2.csv}

echo "== healthz"
curl -s $BASE/healthz | jq '{service,version,regulated_mode:.regulated_mode,embeddings_enabled:.embeddings_enabled,mask:.masking_policy}'

echo "== profile"
curl -s -X POST $BASE/api/v1/profile \
  -F "files=@${B1}" -F "files=@${B2}" \
  -H "X-Run-Id: $RUN" | jq '{run_id,examples_masked,files:(.profiles|keys)}'

echo "== match (threshold=0.72)"
curl -s -X POST "$BASE/api/v1/match?threshold=0.72" \
  -F "files=@${B1}" -F "files=@${B2}" \
  -H "X-Run-Id: $RUN" | jq '{run_id,threshold,stats,reasons_sample:(.candidates[0].reasons),first:.candidates[0]}'

echo "== merge (limit=50)"
curl -s -X POST "$BASE/api/v1/merge?limit=50&entity_resolution=customers_v1" \
  -F "files=@${B1}" -F "files=@${B2}" \
  -F 'decisions=[]' \
  -H "X-Run-Id: $RUN" | jq '{run_id,columns:(.columns[:6]),preview_rows:(.preview_rows[:2]),er_stats}'

echo "== validate (customers)"
curl -s -X POST "$BASE/api/v1/validate" \
  -H 'Content-Type: application/json' \
  -H "X-Run-Id: $RUN" \
  -d '{"contract":"customers","rows":[{"customer_id":"C1","email":"a@b.com"}]}' | jq '{run_id,status,gate_blocked,summary}'

echo "== docs"
curl -s -X POST "$BASE/api/v1/docs" \
  -H 'Content-Type: application/json' \
  -H "X-Run-Id: $RUN" \
  -d '{"mapping":{"version":"1.0","threshold":0.72,"fields":[]}}' | jq '{run_id,manifest_hash,artifacts}'


