import pandas as pd
from app.services.validate import run_validation


def test_validate_customers_contract():
    df = pd.DataFrame({
        "customer_id": [1, 2, 2, None],
        "email": ["a@b.com", "bad", "c@d.com", "x@y.com"],
    })
    res = run_validation(df, "customers")
    # should fail due to not_null and unique violations
    assert res.status == "fail"
    assert any(v.rule.startswith("not_null(customer_id)") for v in res.violations)
    assert any(v.rule.startswith("unique(customer_id)") for v in res.violations)


