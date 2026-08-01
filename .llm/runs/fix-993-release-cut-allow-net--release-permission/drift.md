# Drift Log: release-cut permission diagnosis

## 2026-08-01 — PLAN-EVAL corrected the test strategy

- **What:** Replaced the planned subprocess/live-network committed test with pure exported classification and message helpers plus a rendered operator-line assertion.
- **Source:** independent `plan-eval.md` findings A-C and owner direction.
- **Expected:** The original D3 proposed a subprocess without matching `--allow-run` and a live invalid-token request.
- **Actual:** The existing 63-test suite is hermetic and should not acquire subprocess or GitHub egress dependencies.
- **Severity:** significant
- **Action:** fix
- **Evidence:** revised `plan.md` D1/D3 and Validation Plan.
