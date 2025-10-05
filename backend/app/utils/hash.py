from __future__ import annotations

import hashlib
import json
from typing import Any


def _to_stable_bytes(v: Any) -> bytes:
    """Serialize any JSON-like value to a stable bytes representation."""
    try:
        data = json.dumps(v, sort_keys=True, separators=(",", ":"))
    except TypeError:
        data = json.dumps(str(v), sort_keys=True, separators=(",", ":"))
    return data.encode("utf-8")


def sha256_hex(v: Any) -> str:
    h = hashlib.sha256()
    h.update(_to_stable_bytes(v))
    return h.hexdigest()


