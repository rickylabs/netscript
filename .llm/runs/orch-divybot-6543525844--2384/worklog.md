# Worklog

## Design

1. Public surface: plugin install/update/remove, local plugin install, service
   add/remove preserve browser files and expose an informational DoctorReport in
   their existing structured results and normal command text.
2. Vocabulary: written paths; current exact canonical file (no finding); skipped
   authored topology; skipped already-present divergent file. Use existing
   DoctorReport/DoctorCheck rather than a separate diagnostic hierarchy.
3. Ports: existing FileSystemPort and GeneratedSourceFormatterPort only.
4. Constants: named browser-auth report identity and finite skip reasons, defined
   with the report contract. Existing template keys remain authoritative.
5. Commit slices: S0 plan bootstrap; S1 reporting contract/adapter, six result
   producers, six command renderers, focused regression/negative tests and docs;
   S2 closeout evidence. Each includes this worklog and context-pack.
6. Deferred scope: runtime auth, templates/presets, dependency changes and auto-repair.
   Local expensive E2E is prohibited; coordinator arms CI e2e-cli-gate.
7. Contributor path: browser-auth-reconciler.ts is the place to extend candidate
   comparison/ownership behavior; tests alongside it prove preservation.

## Bootstrap

Resolved feature matrix via JSON; recorded exact owner evaluator override in
supervisor.md. Requested effort high. PLAN-EVAL required before source edits.
RTK unavailable (command-not-found); direct shell inspection used. No lock edits.
PR references issue 2384; no labels/milestones changed, per owner override.

## S1 implementation and evidence

PLAN-EVAL passed before source edits. Reconciliation now returns written paths
and an existing DoctorReport. Six lifecycle command entry points carry/render the
same report (update uses install's report after committing its stage). Exact
canonical matches have no finding. Authored paths, including absent paths, report
skips; differing preserved files additionally report divergence. All checks have
ok=true. Existing file bytes and independently owned service wiring are preserved.

| Gate | Result |
| --- | --- |
| Baseline colocated reconciler suite | 18 passed, exit 0 |
| Focused reporting/reconciler/install-command suites | 27 passed, exit 0 |
| Lifecycle suites (install/local install/update/remove/service add/remove) | 67 passed, exit 0 |
| Structured check, 19 owned TS files, unstable-kv | 0 findings, exit 0 |
| Structured lint, 19 owned TS files, explicit scoped config | 19 processed, 0 findings, exit 0 |
| Structured format, 19 owned TS files, explicit scoped config | 19 processed, 0 findings, exit 0 |
| Baseline quality:gate | exit 0, existing warnings |
| Baseline CLI doc-lint / JSR audit | exit 0 / exit 0, existing audit warnings |

### Reporting negative controls

Temporary source mutations were each restored byte-for-byte in a finally block;
negative test processes used --no-check solely because the intentionally removed
report breaks the return contract. Every verdict came from run-deno-test.ts.

1. Remove the returned report envelope: **5 failed, 0 passed, exit 1**. This
   includes all four required acceptance scenarios (fresh, authored, canonical
   rerun, divergent) plus mixed ownership. Fresh/rerun assert the explicit empty
   report, so silently dropping structured reporting cannot pass.
2. Retain the report but discard findings: **3 failed, 2 passed, exit 1**.
   Authored, divergent and mixed cases fail; the two no-finding controls pass.
   This distinguishes lost reporting from legitimate silent parity.
3. Disable normal report rendering: **3 failed, 0 passed, exit 1**. The real
   install command (authored and scaffold) and staged update command all fail
   their output assertions while their file-preservation behavior is exercised.

The restored positive suite is being rerun, along with the final quality/doc/JSR
checks. E2E CLI CI remains required and unproven until the coordinator arms it.
No local runtime resources were started; no teardown ownership ambiguity exists.

Reconcile: PR 2530 remains a draft against main. Related issue 2384 remains open;
no labels/milestones or acceptance boxes changed. No template or lock changes.
Independent implementation review is next, before slice sign-off and push.

Final S1 gates: restored reporting set **27 passed**, lifecycle set **67 passed**;
quality:gate exit 0, doc-lint exit 0 (all three CLI entrypoints), JSR audit exit 0
with publish dry-run OK. Audit findings remain **23**, matching baseline exactly
(including one slow-type warning). Final scoped lint/fmt use the tracked run config
and process all **19** selected source files, zero findings. Public wrapper-derived
counts and negative test names are in gate-summary.json; these summaries are not
run-gate receipts. Review-thread gate passes with zero unanswered threads. A fresh
main fetch shows no generator drift against the comparison baseline.

### Independent implementation review — repair F1

The substantive first review returned FAIL_FIX: authored Workdir values outside
or equal to the project root had newly reached the scaffold-only throwing path
resolver. The settings contract permits these layouts. Fixed by reporting each
selected authored route as skipped/not inspected before path probing, while
retaining the original strict scaffold resolver. Regression runs both `../external`
and `.` twice, asserting no writes, no route reads/probes, and only ok=true checks.

Performance advisory: absent authored candidates now skip canonical formatting
entirely. Existing candidates retain the established formatContent port so this
reporting slice does not introduce batch-size/capacity policy. Batching existing
file comparisons is deferred. The configured authored topology remains the reason
for preserving shared helpers on later runs, even if a prior service-wiring run
created one; creation origin does not grant overwrite permission.

The initial brief-access refusal was not a review verdict. The same implementation
evaluator session is re-steered for this repair. No second terminal failure has
occurred, and no evaluator session/family was substituted.

F1 repair validation: reporting set **28 passed**, lifecycle set **67 passed**,
structured check/lint/fmt over 19 owned TypeScript files all exit 0, and renewed
quality:gate exit 0. Repeated mutation controls now include the authored-layout
regression: missing envelope **6 failed / 0 passed**; discarded findings **4 failed /
2 passed**. Restored positive reporting run passes again. The previous renderer
control remains applicable because rendering code is unchanged. gate-summary.json
contains the final counts. No test failure is hidden by ignored tests or filters.

Independent slice sign-off: the same Claude Opus 5.5 reviewer returned **PASS**
after verifying the F1 repair, current source and final evidence. See evaluate.md.
S1 is terminal and ready to commit/push. Source snapshot hashes are unchanged since
the reviewed repair. The evidence packaging is S2; final exact-head evaluation
will be recorded as a PR comment to avoid changing its own reviewed commit.

## S2 evidence packaging and handoff

S1 landed at 8981fa6 and its PR phase comment records scope and gate evidence.
S2 packages the already reviewed run evidence, scoped validation config, gate
summary, command inventory and dated lesson. No product source changes follow the
independent PASS. JSON parsing and diff hygiene prove this documentation slice;
its claims are cross-checked against the structured wrapper outputs. The final
same-session review will cover the exact pushed S2 head after readiness.

Reconcile: issue 2384 remains open; PR 2530 references it without a closing keyword
per owner. Coordinator retains labels/milestones, merge and e2e-cli-gate ownership.
No acceptance checkbox on the issue was changed. No lock/template drift. All three
issue acceptance behaviors have local evidence; the full CI E2E merge gate remains
explicitly required and unproven until the coordinator arms it.
