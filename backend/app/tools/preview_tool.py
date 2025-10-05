from __future__ import annotations


async def preview_pipeline(run_id: str) -> dict:
    """Return deterministic mock pipeline preview.

    Raises for certain run_ids to simulate tool failure.
    """
    if run_id == "FAIL_PREVIEW":
        raise RuntimeError("preview unavailable")
    # Simple echo of deterministic data similar to merge tool
    rows = [{"id": i + 1, "first_name": f"Alice {i}", "last_name": f"Smith {i}", "balance": 1000.0 + i} for i in range(200)]
    columns = ["id", "first_name", "last_name", "balance"]
    return {"columns": columns, "rows": rows}


