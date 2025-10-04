import io
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def _csv(s: str) -> tuple[str, bytes, str]:
    return ("files", ("tmp.csv", s.encode("utf-8"), "text/csv"))


def test_match_reasons_stats_high_confidence():
    # Left: acct_id 1..6 ; Right: account_number with 1..4,9,10 => Jaccard 0.5
    left = "acct_id\n1\n2\n3\n4\n5\n6\n"
    right = "account_number\n1\n2\n3\n4\n5\n6\n"
    files = [_csv(left), _csv(right)]
    r = client.post("/api/v1/match?threshold=0.6", files=files)
    assert r.status_code == 200
    data = r.json()
    assert "threshold" in data and abs(float(data["threshold"]) - 0.6) < 1e-6
    assert "stats" in data
    stats = data["stats"]
    # We compare at least one auto and zero review for the best exact-match pair
    assert int(stats["auto_count"]) >= 1
    assert float(stats["auto_pct"]) == 100.0
    # minutes saved = auto_count * 12 / 60 = 0.2 by default
    assert abs(float(stats["estimated_minutes_saved"]) - 0.2) < 1e-6
    c = data["candidates"][0]
    reasons = set(c.get("reasons", []))
    warnings = set(c.get("warnings", []))
    # Name similarity should be high or moderate depending on fuzz; accept either
    assert ("High name similarity" in reasons) or ("Moderate name similarity" in reasons)
    assert "Types compatible" in reasons
    # Overlap is exactly 0.5 => High value overlap
    assert "High value overlap" in reasons
    assert warnings == set()


def test_match_examples_masked_for_email():
    left = "email\na@b.com\n"
    right = "email\na@b.com\n"
    files = [_csv(left), _csv(right)]
    r = client.post("/api/v1/match", files=files)
    assert r.status_code == 200
    data = r.json()
    # find the email candidate
    cand = next((c for c in data["candidates"] if c["left_column"].lower() == "email" and c["right_column"].lower() == "email"), None)
    assert cand is not None
    assert any("***@***" in ex for ex in cand["explain"]["left_examples"])  # masked


def test_match_reasons_stats_low_confidence_review():
    # Name very different, type mismatch (number vs string), low overlap
    left = "amount\n1\n2\n3\n"
    right = "code\nX\nY\nZ\n"
    files = [_csv(left), _csv(right)]
    r = client.post("/api/v1/match?threshold=0.8", files=files)
    assert r.status_code == 200
    data = r.json()
    c = data["candidates"][0]
    reasons = set(c.get("reasons", []))
    warnings = set(c.get("warnings", []))
    assert "Low name similarity" in warnings
    assert "Type mismatch" in warnings
    assert "Low value overlap" in warnings
    # stats: at least one pair, but all below threshold
    stats = data["stats"]
    assert int(stats["auto_count"]) == 0
    assert int(stats["review_count"]) == 1
    assert float(stats["auto_pct"]) == 0.0
    assert float(stats["estimated_minutes_saved"]) == 0.0


