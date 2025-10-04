import pandas as pd
from app.schemas.merge import MappingDecision
from app.services.merge import merge_datasets


def test_merge_lineage_and_union():
    left = pd.DataFrame({"id": [1,2], "name": ["A","B"]})
    right = pd.DataFrame({"identifier": [3,4], "name": ["C","D"]})
    decisions = [
        MappingDecision(
            left_table="left", left_column="id",
            right_table="right", right_column="identifier",
            decision="auto", confidence=0.9, transform_ops=None,
        )
    ]
    merged = merge_datasets({"left": left, "right": right}, decisions, lineage_meta={})
    assert set(["id","name","_source_bank","_source_file","_source_row","_transform_chain"]).issubset(set(merged.columns))
    # 2 + 2 rows
    assert len(merged) == 4
    # Right's identifier should be renamed to id
    assert "identifier" not in merged.columns

