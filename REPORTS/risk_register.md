# Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---:|---:|---|---|
| Family gate capping legit pairs | Med | Med | Expand allow‑matrix for id↔id‑like, tune regex, raise cap when name+overlap high | Backend |
| Pairing greedy causes non‑intuitive pair | Low | Low | Entity‑bucket Hungarian; deterministic tie‑breakers already in place | Backend |
| Export gate misaligned with rule IDs | Med | Med | Map required_rules to produced rules; add tests | Backend |
| MSW leak into prod | Low | High | CI guard (ensure no MSW in dist), dynamic import only in mock | Frontend/CI |
| Secrets in logs | Low | High | Continue redaction, no payload logging, use presigned TTL | Backend |
| DB path/permissions in demo | Low | Med | Absolute SQLite path + `check_same_thread=False`; Postgres via `DB_DSN` in prod | DevOps |
