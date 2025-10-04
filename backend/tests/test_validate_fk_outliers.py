import pandas as pd
from app.services.validate import run_validation


def test_fk_accounts_to_customers():
    accounts = pd.DataFrame({"account_id": [1,2,3], "customer_id": ["C1","C2","C999"]})
    customers = pd.DataFrame({"customer_id": ["C1","C2"]})
    res = run_validation(accounts, "accounts", aux_tables={"customers": customers})
    assert any(v.rule.startswith("fk(customer_id->customer_id)") for v in res.violations)


def test_outliers_zscore():
    df = pd.DataFrame({"amount": [10,11,12,13,1000]})
    res = run_validation(df, "loans")
    assert any(v.rule.startswith("outliers(amount") for v in res.violations)


