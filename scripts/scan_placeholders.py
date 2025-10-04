#!/usr/bin/env python3
import os
import re
import sys

TOKENS = [
    r"TODO", r"FIXME", r"HACK", r"PLACEHOLDER", r"MOCK ", r" DEMO",
    r"minioadmin", r"password", r"apikey", r"api_key", r"Bearer ",
    r"localhost:8000", r"http://localhost", r'allow_origins": \["\*"\]'
]

ALLOWLIST_DIRS = {
    os.path.normpath("frontend/public"),
    os.path.normpath("frontend/src/mocks"),
    os.path.normpath("frontend/src/fixtures"),
    os.path.normpath("tests"),
    os.path.normpath("backend/tests"),
}

ALLOWLIST_FILES = {"README.md", "package-lock.json", "yarn.lock"}


def is_allowed(path: str) -> bool:
    if any(path.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".lock", ".ico", ".svg", ".woff", ".woff2"]):
        return True
    base = os.path.basename(path)
    if base in ALLOWLIST_FILES or base.endswith(".md"):
        return True
    parts = path.split(os.sep)
    for d in ALLOWLIST_DIRS:
        if os.path.normpath(d) in path:
            return True
    return False


def main() -> int:
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fail = False
    pattern = re.compile("|".join(TOKENS), re.IGNORECASE)
    for root, dirs, files in os.walk(repo):
        if ".git" in root:
            continue
        for f in files:
            path = os.path.join(root, f)
            rel = os.path.relpath(path, repo)
            if is_allowed(rel):
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    for i, line in enumerate(fh, 1):
                        if pattern.search(line):
                            print(f"SCAN_FAIL {rel}:{i}: {line.strip()}")
                            fail = True
            except Exception:
                continue
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())


