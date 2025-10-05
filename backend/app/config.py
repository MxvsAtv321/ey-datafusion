from __future__ import annotations

# Core configuration for Agent Verify service

# Security: mask examples and never emit raw PII by default
SECURE_MODE_DEFAULT: bool = True

# Sampling cap for comparisons
SAMPLE_SIZE: int = 200

# Max allowable cell-level difference rate for SAFE_YES
CELL_DIFF_THRESHOLD: float = 0.005

# Per-tool timeout guard (seconds)
REQUEST_TIMEOUT_S: int = 5


