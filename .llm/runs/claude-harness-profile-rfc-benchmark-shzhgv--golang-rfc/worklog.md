# Worklog — claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc

Design: run-1 harness copied + subject-swapped (G1 via ExecutableRuntimeAdapter); boundary
runner for G2 (official glue in Deno) + G3 (dlopen); probe incl. PY-python3 row. PLAN-EVAL: N/A
(plan L5). Correctness: exact acc identity per rep across G1/G2/G3/py (846234426 / 777999478 /
299547431 spot values).

## Gate results

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| V1 | Cross-language identity (G1 bin, c-shared, js/wasm, python) | PASS | build outputs + per-rep asserts |
| V2 | Protocol completeness (5 series × 320 + probe + boundary), 0 failures | PASS | run-all-4 log `failed=0` |
| V3 | results-go.md script-generated | PASS | report-4.ts output |
| V4 | RFC fmt + zero TBD + links (prose false-positives triaged as before) | PASS | gate output |
| V4 | Fitness/quality | N/A | no packages/plugins source |
