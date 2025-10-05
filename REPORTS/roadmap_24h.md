# Roadmap – Next 24 Hours (to demo)

## Now → +6h (Stabilization)
- Align tests with Family Gate:
  - Update expectations in `test_match.py` and `test_match_reasons_stats.py` to account for cross‑family cap, or refine `_infer_family` allow‑list for id↔id‑like names.
- Validate gate rule mapping: ensure `required_rules` matches produced rule names; add a small mapping layer if needed.
- Smoke /pair → Accept All → /match with real files; record outputs in REPORTS.

## +6h → +14h (Pairing polish)
- Optional: entity‑bucket Hungarian matching (fallback to greedy if SciPy unavailable).
- Many‑to‑one warning surfaced when two left tables compete for one right; render hint in Pairing UI.
- Add Cypress/E2E smoke: profile → pair → accept all → mapping → threshold interaction → export blocked/unblocked.

## +14h → Demo (UX and Evidence)
- Heatmap hover tooltips, keyboard a11y for pair rows.
- Evidence bundle enrichment: include pairing matrix and family‑gate configuration snapshot.
- README: quickstart (run servers, set API_KEY, smoke commands), demo script.
