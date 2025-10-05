# Pipeline Invariants (encoded in code + tests)

I1. Pair → Match
- If the active pair `(leftTable,rightTable)` changes, Mapping MUST refetch `/match` keyed by the exact pair + threshold.
- Mapping decisions MUST reset when the pair changes.
- Why it fails in the wild: stale candidates after pair switches; UI shows cross‑domain suggestions.

I2. Threshold → Match
- Debounced threshold changes MUST refetch `/match?threshold=...` and UI MUST render server‑echoed `response.threshold` and `response.stats`.
- Why it fails: optimistic slider and server drift.

I3. Secure Mode truth
- Badge and masking MUST reflect `/healthz` only. Embeddings off → `embedding` scores 0; reasons/warnings omit “Semantic match”.
- Why it fails: hardcoded flags in UI.

I4. Validation gate
- If `gate_blocked=true`, Export MUST be disabled; banner MUST link to Validation and focus the violations panel.
- Why it fails: missing navigation/focus patterns.

I5. Pairing guard
- Mapping MUST NOT render until a valid chosen pair exists; otherwise redirect to Pairing.
- Why it fails: deep-links into Mapping before Pairing.

I6. API contract guard
- Responses MUST be validated at runtime; schema drift should surface as typed errors and user-friendly messages.
- Why it fails: JSON shape changes without compile-time type updates.

See frontend unit/e2e tests and backend tests for enforcement.
