from __future__ import annotations

import os
import time
from typing import Optional

import boto3
from botocore.client import Config

from ..core.config import settings


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def put_object(name: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    bucket = settings.s3_bucket or "ey-datafusion"
    c = _client()
    c.put_object(Bucket=bucket, Key=name, Body=content, ContentType=content_type)
    return f"s3://{bucket}/{name}"


def presigned_url(name: str, expires: int | None = None) -> str:
    bucket = settings.s3_bucket or "ey-datafusion"
    c = _client()
    return c.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": name},
        ExpiresIn=expires if expires is not None else settings.s3_presign_ttl,
    )


