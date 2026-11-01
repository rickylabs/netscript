# Current S6 runtime blocker — resume here

S5 repair committed/pushed as 1694559. Independent S5 PASS, 387 tests pass, all
15 root check tasks including postcommit assets freshness pass. PR2572 now DRAFT
again because coordinator found a separate real runtime blocker. No READY.

S6 exact-order red reproduced both natively and under a REAL isolated Aspire host:
init shop --app-name shop-web --db sqlite --service --service-name orders
--model-name Order; start service/app; db init/generate/seed all0. Health200,
Records200/unavailable, Overview200/unavailable, /examples/orders500. Source route
exists. Undefined.findMany from retained init Prisma placeholder in no-watch service.
Control generating DB before service start renders actual Seed Order everywhere.
See s6-runtime-diagnosis.md and s6-aspire-red.json.

S6 plan review running in separate same Claude evaluator (read-only Opus5.5 high),
output s6-plan-review.md. Do not implement until PASS_PLAN. Consultation is complete
in s6-diagnosis-review.md; not a terminal verdict. Plan in s6-plan.md adopts:
- Honest placeholder $queryRaw/$queryRawUnsafe reject until generated (real health).
- Resident successful db generate only: restart/wait only enabled, Running, exact
  service identities with declarative deno.json @database import pointing at selected
  DB facade. Avoid memory services (no @database). No broad host/app/plugin restart.
- Keep lease/cancel/timeout/fail closed; no refresh standalone/no-Aspire/non-generate.
- Conditional typed canonical link on static CRUD reference (no false no-service claim).
- Add Seed User row DOM checks in existing scaffold.runtime app reference probe,
  with negative controls, plus exact-order live red/green evidence.

Actual fixture: .llm/tmp/scaffold-2570/s6-aspire/shop (cache false via public CLI to
avoid unavailable Docker). Its Aspire apphost is running and still stale/red after
DB codegen. Use own exact apphost path for operations. Foreign deploy-a9eb15e AppHost
exists; never mutate it. Four native manual process groups in s6 and s6-before were
stopped with cwd ownership proof. Private process state/logs under project runs path.

Surprise: dotnet shim has no selected SDK and Docker unavailable, but Aspire uses
its own installed runtime and can start isolated cache-free SQLite host. Do not
claim native SDK present; do use the working isolated Aspire for focused proof.

No S6 product edits yet. Only supervisor/worklog/drift/plan/reports changed. Fresh
init adds transient @fresh/init resolutions to root deno.lock; reviewed/restored once,
check again before commit. Never delete locks/caches. No runtime fixture source edits.

S6 plan review is active; other research/repro processes complete.
Private evaluator ID lives in impl-eval-session; do not expose it. Continue same
Claude reviewer for terminal S6 plan and implementation verdicts.

Source pointers: database/operations/operation-runner.ts holds resident AppHost lease
and exact Aspire executor; new refresh helper fits beside it. Existing helper resource
parser is private and finds first exact match; new selection must reject ambiguity.
Placeholder generator: kernel/adapters/database/scaffolder.ts. No service delegate,
no $queryRaw: defineService skips DB health entirely. Actual data failure is not SDK.
Generated services deno.json contains @database only when hasDatabase true.
Runtime probe: packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts;
tests under packages/cli/e2e/tests/application/gates/probe-app-reference_test.ts.
Existing runtime suite public DB_GENERATE runs after Aspire start; keep pre-codegen
for typecheck. Extend actual app row checks, not just a mocked helper test.

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

S6 current:416 testsPASS/55files,30 followupPASS,11-file source wrappersPASS.
Actual isolated Aspire red/green and honest first-boot health receipts complete.
20 real-backend browser cases;12 production probe red/green pairsPASS. Code review
PASS; final evidence review and visual supplement pending. Full runtime UNPROVEN
because host preflight/Docker unavailable. Need sign-off commit, assets-barrel
postcommit gate, normal push, fresh CI green/policy-skipped, then READY handoff.

S6 terminal local review: independent Claude final PASS, F1-F6 resolved/recorded. Independent Astra live supplement PASS all12 Utility captures >=8 fidelity/quality. Reviewer N1 CI-order wording corrected: CI pre-generates, then refreshes after start; only focused isolated proof covers placeholder-first boot. Prior readiness-policy-review.md still governs non-opt-in runtime skip; full runtime is truthfully UNPROVEN, not PASS. Sign-off approved locally; postcommit carrier and fresh remote checks remain.
