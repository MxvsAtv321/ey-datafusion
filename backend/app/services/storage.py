"""Storage service stub (B8 will implement)."""

def put_object(name: str, content: bytes, content_type: str = "application/octet-stream") -> str:  # stub
    return f"s3://bucket/{name}"


def presigned_url(name: str) -> str:  # stub
    return f"https://example.com/{name}"


