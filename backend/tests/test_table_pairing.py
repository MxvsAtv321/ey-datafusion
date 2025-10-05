from app.schemas.profile import TableProfile, ColumnProfile
from app.services.table_pairing import pair_tables, _infer_entity


def _tp(name: str, rows: int, cols: list[tuple[str,str,list[str],bool]]):
    cps = [ColumnProfile(name=c, dtype=d, null_count=0, unique_count_sampled=10, candidate_primary_key_sampled=pk, examples=[], semantic_tags=tags) for c, d, tags, pk in cols]
    return TableProfile(table=name, rows=rows, columns=len(cps), sample_n=100, columns_profile=cps)


def test_entity_inference_basic():
    t = _tp("Customers", 100, [("email","string",["email_like"],False)])
    assert _infer_entity(t) == "customers"


def test_pairing_accounts_and_customers():
    left = [
        _tp("CurSav_Accounts", 10000, [("accountid","string",["iban_like"],True),("balance","number",["currency_amount_like"],False)]),
        _tp("FixedTerm_Accounts", 12000, [("accountid","string",["iban_like"],True),("open_date","datetime",["date_iso"],False)]),
        _tp("Customers", 5000, [("email","string",["email_like"],False),("phone","string",["phone_like"],False)]),
    ]
    right = [
        _tp("Deposit_Accounts", 11000, [("accountid","string",["iban_like"],True),("balance","number",["currency_amount_like"],False)]),
        _tp("Customers", 5200, [("email","string",["email_like"],False)]),
        _tp("Addresses", 5200, [("line1","string",["address_like"],False)]),
    ]

    pairs, ul, ur, matrix = pair_tables(left, right)
    names = {(p["left_table"], p["right_table"]) for p in pairs}
    assert ("CurSav_Accounts","Deposit_Accounts") in names
    assert ("Customers","Customers") in names
    # addresses may be left unmatched or paired last depending on greedy choice; assert core pairs exist
    assert ("CurSav_Accounts","Deposit_Accounts") in names


