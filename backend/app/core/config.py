import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    service_name: str = "ey-datafusion"
    version: str = "0.1.0"

    # Security
    api_key: str | None = os.getenv("API_KEY")
    regulated_mode: bool = os.getenv("REGULATED_MODE", "true").lower() in {"1", "true", "yes"}
    disable_openapi: bool = os.getenv("DISABLE_OPENAPI", "false").lower() in {"1", "true", "yes"}
    allowed_origins: list[str] = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
    required_rules: list[str] = [r.strip() for r in os.getenv("REQUIRED_RULES", "").split(",") if r.strip()]

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


settings = Settings()


