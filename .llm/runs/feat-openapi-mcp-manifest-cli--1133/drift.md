# Drift Log: Aspire CLI adapter hardening

## 2026-08-04 — F1(b) re-scope replaces manifest emission

- **What:** Issue #1133's original manifest-template deliverable is replaced by production hardening
  of the `aspire-cli` endpoint source.
- **Source:** RFC #1123 §F1, P1 verdict, owner/orchestrator comment, staged brief.
- **Expected:** Post-allocation manifest template emission if P1 passed.
- **Actual:** P1 `FAIL` selects qualified F1(b); S5's CLI adapter is primary and this slice extends it.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`

## 2026-08-04 — formal PLAN-EVAL composed at milestone level

- **What:** No local formal PLAN-EVAL is launched.
- **Source:** Milestone-run evaluator protocol and orchestrator ruling D6 in the owner brief.
- **Expected:** Ordinary single-run harness would use a separate local PLAN-EVAL.
- **Actual:** `plan-eval.md` records `COMPOSED_NOT_LOCAL`; evaluation occurs via separate composed surfaces.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/harness/workflow/milestone-run.md`

