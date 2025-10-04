import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    service_name: str = "ey-datafusion"
    version: str = "0.1.0"

    # Security
    api_key: str | None = os.getenv("API_KEY")
    regulated_mode: bool = os.getenv("REGULATED_MODE", "true").lower() in {"1", "true", "yes"}
    disable_openapi: bool = os.getenv("DISABLE_OPENAPI", "false").lower() in {"1", "true", "yes"}
    allowed_origins: list[str] = field(default_factory=lambda: [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()])
    required_rules: list[str] = field(default_factory=lambda: [r.strip() for r in os.getenv("REQUIRED_RULES", "").split(",") if r.strip()])
    review_seconds_per_field: int = int(os.getenv("REVIEW_SECONDS_PER_FIELD", "12"))
    profile_examples_masked: bool = os.getenv("PROFILE_EXAMPLES_MASKED", "true").lower() in {"1","true","yes"}
    # Object storage
    s3_presign_ttl: int = int(os.getenv("S3_PRESIGN_TTL", "3600"))

    # DB
    db_dsn: str | None = os.getenv("DB_DSN")

    # S3 / MinIO
    s3_endpoint: str | None = os.getenv("S3_ENDPOINT")
    s3_bucket: str | None = os.getenv("S3_BUCKET")
    s3_access_key: str | None = os.getenv("S3_ACCESS_KEY")
    s3_secret_key: str | None = os.getenv("S3_SECRET_KEY")

    # Features
    embeddings_enabled: bool = os.getenv("EMBEDDINGS_ENABLED", "false").lower() in {"1", "true", "yes"}
    match_auto_threshold: float = float(os.getenv("MATCH_AUTO_THRESHOLD", "0.70"))
    sample_n: int = int(os.getenv("SAMPLE_N", "2000"))
    # Match weights
    match_weight_name: float = float(os.getenv("MATCH_WEIGHT_NAME", "0.45"))
    match_weight_type: float = float(os.getenv("MATCH_WEIGHT_TYPE", "0.20"))
    match_weight_overlap: float = float(os.getenv("MATCH_WEIGHT_OVERLAP", "0.20"))
    match_weight_embed: float = float(os.getenv("MATCH_WEIGHT_EMBED", "0.15"))
    # Drift thresholds
    drift_warn_delta: float = float(os.getenv("DRIFT_WARN_DELTA", "0.15"))
    drift_crit_delta: float = float(os.getenv("DRIFT_CRIT_DELTA", "0.30"))
    # Merge preview
    merge_preview_default: int = int(os.getenv("MERGE_PREVIEW_DEFAULT", "50"))
    merge_preview_max: int = int(os.getenv("MERGE_PREVIEW_MAX", "500"))
    # PK heuristic ratio
    pk_unique_ratio: float = float(os.getenv("PK_UNIQUE_RATIO", "0.99"))
    # Outliers
    outlier_iqr_k: float = float(os.getenv("OUTLIER_IQR_K", "1.5"))
    outlier_z: float = float(os.getenv("OUTLIER_Z", "3.0"))


settings = Settings()


