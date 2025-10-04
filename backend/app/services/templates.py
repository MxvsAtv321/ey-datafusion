from __future__ import annotations

import uuid
from typing import Dict, Any, List

_TEMPLATES: Dict[str, Dict[str, Any]] = {}


def save_template(name: str, manifest: dict, profile_snapshot: dict) -> str:
    tid = str(uuid.uuid4())
    _TEMPLATES[name] = {"id": tid, "manifest": manifest, "profile": profile_snapshot}
    return tid


def apply_template(name: str, current_profile: dict):
    tpl = _TEMPLATES.get(name)
    if not tpl:
        return {"decisions": [], "notes": ["template not found"]}
    manifest = tpl.get("manifest", {})
    fields: List[Dict[str, Any]] = manifest.get("fields", [])
    # naive application: return stored fields as decisions
    decisions = []
    for f in fields:
        decisions.append({
            "left_table": f.get("left_table", "left"),
            "left_column": f.get("left_column"),
            "right_table": f.get("right_table", "right"),
            "right_column": f.get("right_column"),
            "decision": f.get("decision", "auto"),
            "confidence": f.get("confidence", 0.0),
            "transform_ops": f.get("transform_ops"),
        })
    return {"decisions": decisions, "notes": []}


