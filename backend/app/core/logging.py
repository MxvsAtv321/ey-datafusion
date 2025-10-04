import json
import logging
import sys
import time
import uuid
from typing import Any, Dict


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        base: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
        }
        # Redact simple PII in message
        msg = str(base.get("message", ""))
        msg = self._redact(msg)
        base["message"] = msg
        # Propagate extras like request_id, run_id if present
        for key in ("request_id", "run_id", "path", "method", "status_code"):
            if hasattr(record, key):
                base[key] = getattr(record, key)
        if record.exc_info:
            base["exc_info"] = self._redact(self.formatException(record.exc_info))
        return json.dumps(base, ensure_ascii=False)

    @staticmethod
    def _redact(text: str) -> str:
        import re
        # email
        text = re.sub(r"([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+)\.[A-Za-z]{2,}", r"\1***@***.com", text)
        # phone (keep last 4)
        text = re.sub(r"\+?\d[\d\s\-().]{6,}(\d{4})", r"***-***-\1", text)
        # IBAN keep last 4
        text = re.sub(r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}(\d{4})\b", r"****\1", text, flags=re.I)
        return text


def setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonLogFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)


def generate_request_id() -> str:
    return str(uuid.uuid4())


