from __future__ import annotations

import json
from typing import List, Dict, Any

from .transform_dsl import format_chain, validate_ops


def _fmt2(x: float) -> str:
    try:
        return f"{float(x):.2f}"
    except Exception:
        return "0.00"


def _field_rows(fields: List[Dict[str, Any]]) -> List[str]:
    rows: List[str] = []
    for f in fields:
        left = f.get("left_column") or f.get("left") or ""
        right = f.get("right_column") or f.get("right") or ""
        decision = f.get("decision", "review")
        confidence = _fmt2(f.get("confidence", 0.0))
        scores = f.get("scores", {})
        name = _fmt2(scores.get("name", 0.0))
        typ = _fmt2(scores.get("type", 0.0))
        overlap = _fmt2(scores.get("value_overlap", 0.0))
        emb = _fmt2(scores.get("embedding", 0.0))
        ops = f.get("transform_ops") or []
        try:
            ops_valid = validate_ops(ops) if isinstance(ops, list) else []
            transform = format_chain(ops_valid) if ops_valid else ""
        except Exception:
            transform = ""
        rows.append(f"| {left} | {right} | {decision} | {confidence} | {name} | {typ} | {overlap} | {emb} | {transform} |")
    return rows


def generate_docs(mapping_manifest: Dict[str, Any], run_id: str, threshold: float):
    fields = mapping_manifest.get("fields", []) if isinstance(mapping_manifest, dict) else []
    # normalize fields: sort by left_column asc, then confidence desc
    def _left_key(f: Dict[str, Any]) -> str:
        return (f.get("left_column") or f.get("left") or "").lower()

    def _conf_key(f: Dict[str, Any]) -> float:
        try:
            return float(f.get("confidence", 0.0))
        except Exception:
            return 0.0

    fields_sorted = sorted(fields, key=lambda f: (_left_key(f), -_conf_key(f)))
    manifest_norm = dict(mapping_manifest)
    manifest_norm["fields"] = fields_sorted

    # Markdown
    left_tables = sorted({f.get("left_table", "left") for f in fields_sorted})
    right_tables = sorted({f.get("right_table", "right") for f in fields_sorted})
    md_lines = [
        "# EY DataFusion Mapping Documentation",
        "",
        "## Overview",
        f"Run ID: `{run_id}`  ",
        f"Threshold: `{_fmt2(threshold)}`",
        f"Left tables: `{', '.join(left_tables) or 'n/a'}`",
        f"Right tables: `{', '.join(right_tables) or 'n/a'}`",
        "",
        "## Field Mapping Table",
        "| Left | Right | Decision | Confidence | Name | Type | Overlap | Embedding | Transform |",
        "|---|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    md_lines.extend(_field_rows(fields_sorted))
    md_lines += [
        "",
        "## Assumptions & Notes",
        "- Confidence = 0.45×name + 0.20×type + 0.20×overlap + 0.15×embedding",
        "- Threshold determines auto vs review decisions.",
        "",
        "## Lineage Policy",
        "The following columns are appended to every merged row:",
        "- `_source_bank`",
        "- `_source_file`",
        "- `_source_row`",
        "- `_transform_chain`",
    ]
    markdown = "\n".join(md_lines)

    json_str = json.dumps(manifest_norm, sort_keys=True)
    return markdown, json_str


