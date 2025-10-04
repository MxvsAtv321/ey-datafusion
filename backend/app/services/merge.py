from __future__ import annotations

from typing import Dict, List

import pandas as pd

from .transform_dsl import validate_ops, apply_ops, format_chain
from ..schemas.merge import MappingDecision, TransformOp


def _build_colmap_and_ops(decisions: List[MappingDecision]) -> tuple[Dict[str, str], List[TransformOp]]:
    colmap: Dict[str, str] = {}
    ops_all: List[TransformOp] = []
    for d in decisions:
        if d.decision in {"accept", "auto"}:
            colmap[d.right_column] = d.left_column
            if d.transform_ops:
                ops_all.extend(d.transform_ops)
    return colmap, ops_all


def merge_datasets(
    dfs: Dict[str, pd.DataFrame],
    decisions: List[MappingDecision],
    lineage_meta: Dict,
) -> pd.DataFrame:
    left_df = dfs.get("left")
    right_df = dfs.get("right")
    if left_df is None or right_df is None:
        raise ValueError("dfs must include 'left' and 'right'")

    colmap, ops_all = _build_colmap_and_ops(decisions)

    # Apply transforms on right df (pure operations)
    if ops_all:
        validated = validate_ops([op.model_dump() for op in ops_all])
        right_df = apply_ops(right_df, validated)
        transform_chain = format_chain(validated)
    else:
        transform_chain = ""

    # Rename right columns according to accepted/auto mappings
    right_renamed = right_df.rename(columns=colmap)

    # Align columns: union of left and right_renamed
    all_cols = list(dict.fromkeys(list(left_df.columns) + list(right_renamed.columns)))
    left_aligned = left_df.reindex(columns=all_cols)
    right_aligned = right_renamed.reindex(columns=all_cols)

    # Lineage columns
    left_bank = lineage_meta.get("left", {}).get("_source_bank", lineage_meta.get("left_bank", "left"))
    left_file = lineage_meta.get("left", {}).get("_source_file", lineage_meta.get("left_file", "left.csv"))
    right_bank = lineage_meta.get("right", {}).get("_source_bank", lineage_meta.get("right_bank", "right"))
    right_file = lineage_meta.get("right", {}).get("_source_file", lineage_meta.get("right_file", "right.csv"))

    left_aligned = left_aligned.copy()
    right_aligned = right_aligned.copy()

    left_aligned["_source_bank"] = left_bank
    left_aligned["_source_file"] = left_file
    left_aligned["_source_row"] = left_aligned.index
    left_aligned["_transform_chain"] = ""

    right_aligned["_source_bank"] = right_bank
    right_aligned["_source_file"] = right_file
    right_aligned["_source_row"] = right_aligned.index
    right_aligned["_transform_chain"] = transform_chain if ops_all else ""

    merged = pd.concat([left_aligned, right_aligned], ignore_index=True)
    return merged


def er_lite_customers(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Deterministic, opt-in deduping for customers. Blocks on email or customer_id.
    Prefers left-bank rows by sorting _source_bank ascending (left before right),
    then keeps first non-null per column per key.
    """
    key = None
    for k in ("email", "customer_id"):
        if k in df.columns:
            key = k
            break
    if key is None:
        return df, {"clusters": 0, "merged_rows": 0}
    before = len(df)
    # sort so that left rows appear first; then groupby keeps first non-null values
    sort_cols = ["_source_bank"] if "_source_bank" in df.columns else []
    work = df.copy()
    if sort_cols:
        work["_source_bank_sort"] = work["_source_bank"].map({"left": 0, "right": 1}).fillna(2)
        sort_cols = ["_source_bank_sort"]
    work = work.sort_values(sort_cols) if sort_cols else work
    agg: dict[str, str] = {}
    for c in work.columns:
        agg[c] = "first"
    dedup = work.groupby(key, dropna=False, as_index=False).agg(agg)
    if "_source_bank_sort" in dedup.columns:
        dedup = dedup.drop(columns=["_source_bank_sort"])
    merged_rows = before - len(dedup)
    clusters = dedup[key].nunique(dropna=False)
    return dedup, {"clusters": int(clusters), "merged_rows": int(merged_rows)}


