import pandas as pd
from app.services.match import suggest_mappings


def test_suggest_mappings_basic():
    left = pd.DataFrame({
        "customer_id": ["C1","C2","C3","C4"],
        "email": ["a@b.com","b@b.com","c@b.com","d@b.com"],
        "dob": ["1990-01-01","1990-02-02","1991-03-03","1992-04-04"]
    })
    right = pd.DataFrame({
        "customer_number": ["C1","C2","C999","C4"],
        "e_mail": ["a@b.com","b@b.com","x@y.com","z@w.com"],
        "date_of_birth": ["1990-01-01","1990-02-02","1991-03-03","1992-04-04"]
    })
    out = suggest_mappings(left, right, sample_n=1000)

    cust_pairs = [r for r in out if r["left_column"] == "customer_id"]
    assert cust_pairs[0]["right_column"] == "customer_number"
    # With family gate active, id↔id-like is allowed; confidence should exceed threshold
    assert cust_pairs[0]["confidence"] >= 0.60

    dob_pairs = [r for r in out if r["left_column"] == "dob"]
    assert dob_pairs[0]["right_column"].startswith("date_of_birth")


