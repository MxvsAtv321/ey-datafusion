# Endpoint Catalog – /api/v1

| Method | Path | Handler |
|---|---|---|
| GET | /api/v1/healthz | app/api/routes.py:27-35 |
| POST | /api/v1/profile | app/api/routes.py:39-56 |
| POST | /api/v1/match | app/api/routes.py:59-102 |
| POST | /api/v1/merge | app/api/routes.py:105-145 |
| POST | /api/v1/validate | app/api/routes.py:148-167 |
| POST | /api/v1/docs | app/api/routes.py:170-196 |
| POST | /api/v1/drift/check | app/api/routes.py:199-203 |
| POST | /api/v1/templates/save | app/api/routes.py:206-213 |
| POST | /api/v1/templates/apply | app/api/routes.py:215-219 |
| POST | /api/v1/runs/start | app/api/routes.py:222-226 |
| POST | /api/v1/runs/complete | app/api/routes.py:229-234 |
| GET | /api/v1/runs/{run_id} | app/api/routes.py:237-240 |
| POST | /api/v1/pair | app/api/routes.py:(after 102) |
| POST | /api/v1/copilot/triage | app/api/routes.py:243-249 |
| POST | /api/v1/copilot/fixit | app/api/routes.py:251-254 |
