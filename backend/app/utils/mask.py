from __future__ import annotations

import re
from typing import Any


_LETTER_RE = re.compile(r"[A-Za-z]")
_DIGIT_RE = re.compile(r"\d")


def mask_value(v: Any) -> str:
    """Stringify value and mask letters to 'x' and digits to '#'.

    Punctuation and whitespace are preserved to keep shape without exposing PII.
    None becomes empty string.
    """
    if v is None:
        s = ""
    else:
        s = str(v)
    s = _LETTER_RE.sub("x", s)
    s = _DIGIT_RE.sub("#", s)
    return s


