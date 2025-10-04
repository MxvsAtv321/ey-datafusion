from app.services.docs import generate_docs


def test_generate_docs_basic():
    manifest = {
        "fields": [
            {"left_table":"L","left_column":"id","right_table":"R","right_column":"identifier","decision":"auto","confidence":0.92,"scores":{"name":0.9,"type":1.0,"value_overlap":0.8,"embedding":0.0}},
            {"left_table":"L","left_column":"email","right_table":"R","right_column":"e_mail","decision":"review","confidence":0.65,"scores":{"name":0.7,"type":1.0,"value_overlap":0.5,"embedding":0.0}},
        ]
    }
    md, js = generate_docs(manifest, run_id="run-1", threshold=0.7)
    assert "Field Mapping Table" in md
    assert "| id | identifier |" in md
    assert js.startswith("{") and js.endswith("}")

