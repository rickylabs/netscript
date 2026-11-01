use harness
## SKILL
netscript-harness, netscript-tools. Independent S4 slice review, same evaluator, read-only,
blockers only. No edits, commits, agents, GitHub mutations or full E2E.
At f13b14c the full E2E workflow passed Postgres 120/0/0, SQLite 113/0/0 and all static suites.
Focused real native-Garnet Aspire proof also passed zero definitions for sagas/workers/triggers,
with HTTP health ready and scoped cleanup, real streams dependency. Core test-2 had exactly
one failure: plugin-check-command_test.ts expected deleting the last workers output.
Read current diff in that test and S4 plan/drift. The issue requires retained empty output.
The updated test imports zero-size handlers/definitions, requires producer/output inventory
membership, preserves read-only parity and adds missing-output negative control.
The AI inactive-output deletion test and foreign-ownership assertions are unchanged.
Full plugin-check test file: 29 passed, 0 failed/ignored. Scoped check/lint/fmt and quality:gate
pass. No runtime source or dependencies changed. Classify old assertion as stale if appropriate;
confirm no gate weakened and return PASS or blocking corrections. End VERDICT: PASS or
VERDICT: CHANGES. Final exact-pushed-head IMPL-EVAL will follow final CI, separate from this
required slice review.
