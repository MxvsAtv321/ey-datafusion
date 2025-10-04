from __future__ import annotations

import re
from typing import List


def _mask_one(v: str) -> str:
    if not v:
        return v
    # email
    if re.fullmatch(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", v):
        return re.sub(r"([A-Za-z0-9._%+-]).*@.*(\.[A-Za-z]{2,})$", r"\1***@***\2", v)
    # phone: keep last 4
    digits = re.sub(r"\D", "", v)
    if len(digits) >= 7:
        return f"***-***-{digits[-4:]}"
    # IBAN: last 4
    if re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{1,30}", v, flags=re.I):
        return "****" + v[-4:]
    # generic: truncate to 12, replace ~50% letters/digits with * deterministically
    s = v[:12]
    out = []
    for i, ch in enumerate(s):
        if ch.isalnum() and (i % 2 == 1):
            out.append("*")
        else:
            out.append(ch)
    return "".join(out)


def mask_examples(values: List[str]) -> List[str]:
    return [_mask_one(str(x)) for x in (values or [])]


