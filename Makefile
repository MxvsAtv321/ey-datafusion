.PHONY: evidence
evidence:
	@echo "Creating evidence bundle for RUN_ID=$${RUN_ID} BASE=$${BASE-http://localhost:8000}"
	python backend/scripts/make_evidence.py --run-id $${RUN_ID} --base $${BASE-http://localhost:8000}


