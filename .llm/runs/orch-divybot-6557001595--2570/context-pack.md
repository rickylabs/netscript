# Resume scaffold redesign #2570

PR #2572, branch orch/divybot-6557001595. Pushed head 1acff81; S5 CI repairs are
signed off: independent implementation PASS and 387/387 tests across 51 files.
The next commit contains the repair; push it normally and verify fresh CI.
Read s5-repair-plan.md, s5-plan-review.md and s5-impl-eval.md first.

S1–S4 implemented Utility shell/dashboard/records/settings/sign-in/palette and actual
generated capability readers. Independent Claude code PASS and independent Astra
visual PASS (96 screenshots, every page >=8 fidelity/quality). Browser 72 cases and
12 interaction sets passed. CSS budgets unchanged. #2488 remains open; no component
fork or showcase plumbing. Never rebase or force-push; merge main if needed.

## S5 CI repair

Current remote CI 41309455869 failed test shards 3–6 plus the close-gate. Fresh UI,
docs, code quality, core typecheck/browser and shards 1–2 passed. Close-gate metadata
was corrected live and its checker passes; a new source push will rerun CI. Do not
claim READY from the old failed run.

Template layout/navigation formatting is canonical with identical emitted output.
Tests now assert actual Utility routes/imports/capability content. The real public
init-then-generate conflict is fixed through optional loader queryInput provenance
with exact complete re-render proof before adoption. Explicit resolver input wins;
edited, unowned, mismatched-client/procedure files retain conflicts. No reconcile
policy change. Plan review C1–C5 adopted. Expanded inventory includes 51 files.

## Readiness policy

Runtime command was attempted and remains UNPROVEN (.NET SDK missing and Docker
unavailable). Independent readiness-policy-review.md confirms the existing non-opt-in
workflow policy permits that lane to skip. Review transition was authorized after
completed local gates. Required remote CI must pass before READY; Cockpit merges.
No labels. Refs #2570/#2566 per highest-priority operator process.

## Remaining work

Commit/push the signed-off S5 repair, run assets-barrel freshness on that commit,
and address any new CI failures. Final READY report goes only through the
ignored .divybot-final-report.tmp → .divybot-final-report.md handoff, with exact head.
Do not commit assignment or handoff files. No session identifiers/absolute paths in
public evidence. Do not add old untracked raw log files to commits.

Accepted debt CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY is in the canonical ledger.
Foreign Aspire resources remain untouched; owned preview/service processes stopped.
Container cleanup is unproved because Docker cannot be inspected.
