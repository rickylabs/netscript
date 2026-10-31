# Worklog

## Design

1. **Public surface:** existing SagaEngine.commitCompensation and SagaTransitionCommitPort behavior; no new exports. Caller retries the same outcome after failed persistence.
2. **Domain vocabulary:** compensation outcome, expected version, committed digest, rollback, ambiguous acknowledgement. Use existing status and identity types.
3. **Ports:** SagaTransitionCommitPort, KvStore.atomic, PrismaSagaStoreClient.$transaction and existing generated command-store provider harness. Test seams wrap provider APIs only.
4. **Constants:** shared fixed saga/correlation/message identity and compensation versions in test fixture; use existing production replay namespace and status vocabulary. No new production constants needed.
5. **Commit slices:** bootstrap plan; one provider regression/documentation slice; evidence handoff if needed. See plan.md for paths and gates.
6. **Deferred scope:** scheduled/cascaded effects delivery, new non-atomic-store support, other B1 issues, releases, local full scaffold runtime.
7. **Contributor path:** compensation retry test fixture explains the invariant and how each backend exercises it; plugin README explains user guarantees.

## Bootstrap and authorization

Main and baseline match at f683946. Assignment file is excluded and will never be staged. RTK is absent; structured wrappers provide verdicts directly. Read predecessor #2159 memories and shared NetScript memory index before focused code research.
Owner route override verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Implementation effort is owner-requested high; the feature matrix was resolved first. Evaluator independence and round limits remain binding.

## Reconcile — bootstrap

#2499 supplies the implementation path but not this issue's full provider regression acceptance. No duplicate #2383 PR exists. Follow the operator's explicit highest-priority Refs-only/no-taxonomy directions; coordinator owns closure, merge, and expensive CI gate. Final canonical report uses excluded file handoff rather than direct issue posting.

## Plan gate

Independent PLAN-EVAL round 1: PASS_PLAN, no blockers. Confirmed existing commit reuse and all four durable provider targets. Clarify same-outcome retry versus deferred cascade redelivery in documentation. Baseline structured core/runtime suite: 254 passed, 0 failed, 12 provider/CI-specific ignores. Real isolated Redis/PostgreSQL started under this run, with shipped fixture migrations applied. No foreign resources touched.

## Slice 1 — acceptance proof

Added one shared compensation retry fixture, KV-family parameterized tests, eight PostgreSQL generated-client cases and plugin store-guarantee docs. Existing production path passes; no second write path or runtime repair is needed. Focused proof: 12 KV-family + 8 PostgreSQL child tests pass, no ignored cases. Negative reservation controls: 6 KV-family + 4 PostgreSQL child cases fail on poisoned retry. Scoped check/lint/fmt and quality:gate pass; JSR audit dry-runs pass. See evidence.md. Independent slice review pending.

## Full gates

| Gate | Result |
| --- | --- |
| Full structured saga core/store/runtime/service suite, real KV/Redis/Postgres | PASS: 291 passed, zero failed, two optional-provider/CI ignores; PostgreSQL child 18 passed |
| Focused compensation acceptance | PASS: 18 KV-family and 12 PostgreSQL child cases, no ignores |
| Old independent-reservation negative control | Expected RED: 9 KV-family + 6 PostgreSQL child before-commit cases fail poisoned retry |
| Structured check/lint/fmt on changed TS | PASS: 2 files, zero findings/dropped files |
| quality:gate via durable runner | PASS, exit 0, includes code quality and architecture |
| JSR core/plugin audit dry-run | PASS, inherited advisory cardinality/banner warnings |
| Public JSDoc codename policy | PASS: 4 tests |
| Full-export doc-lint | Existing failures: 7 core / 30 plugin private references, same as predecessor baseline; exported production source unchanged |
| Local scaffold.runtime | NOT RUN: owner prohibits competing expensive gates; coordinator-armed e2e-cli CI required |

## Reconcile — slice 1

Current main still supplies the sole compensation atomic path; no runtime edits justified. PR #2512 remains draft while the independent slice review runs. No review comments/threads yet. Run ownership is limited to isolated local test providers and one verification worktree; no dependency or lock churn. CI draft checks are skipped, so no runtime CI acceptance is claimed.

## IMPL-EVAL round 1 repair

FAIL_FIX: one blocker, the locked-plan chained/non-terminal compensation variant was omitted. Provider fault seams, actual executions, negative controls, rollback/replay assertions and guarantee docs otherwise pass independent review. Added the compensating outcome variant with a returned sibling compensation across every provider; it exercises the KV open-state retention branch. This tests persisted outcome consistency only, without implementing deferred cascade recovery. Refresh all affected gates and negative controls before round 2.

Expanded final regression after the chained-case repair: **291 passed, zero failed, two optional ignores**; PostgreSQL child **18 passed**. Expanded focused proof: **18 KV-family + 12 PostgreSQL** pass, no ignored cases. Expanded negative controls: **9 KV-family + 6 PostgreSQL before-commit** cases fail poisoned retries. Static wrappers and quality:gate remain green.


## Slice 1 independent sign-off and close hygiene

Same-session read-only IMPL-EVAL round 2: PASS, no blockers, substantive slice sign-off. The evaluator verified the added chained/non-terminal case on every provider and read all actual positive/negative provider logs. It confirms no production path, export, dependency or lock changes, and correct documentation limits. Earlier nonblocking table-count feedback is reconciled above.

Owned Redis and PostgreSQL stopped successfully after the final suite; PostgreSQL stop exit 0. Removed only this run's isolated verification worktree after preserving its exact mutation and evidence. No unknown or foreign resources were touched. Review-thread gate passes with zero threads/unanswered findings. Commit/push this slice and mark PR ready; coordinator retains merge/release and e2e-cli gate ownership. Final review will attest the exact pushed head without later source/run commits.


## CI failure follow-up — research and design

Owner explicitly requests real failed-job diagnosis, fix and push. `gh pr checks 2512` identifies only PostgreSQL scaffold-runtime red; `gh run view 41189386045 --log-failed` proves Garnet exited because dotnet could not resolve garnet-server and requested tool restore. There is no deno_core discovery failure. All core shards, code quality, PostgreSQL conformance and SQLite runtime pass. Latest main runtime tiers also pass; no saga implementation regression is established. Existing preparation pulls Garnet's container image but omits the executable tool that the suite selects. An external unchanged attempt 2 is live and is not ours to restart.

Design extension: public product API and saga vocabulary unchanged. Port: existing Deno.Command dotnet process and scaffold version catalog; tests inject only the process runner. Constants: existing GARNET_TOOL pin, one finite preparation timeout. Commit slice: explicit pinned-tool preflight in existing CI preparation plus failure-propagation tests, proved by structured wrappers and actual local tool resolution. Deferred: no product helper redesign, gate retries, health/timeout relaxation, labels or local full E2E. Contributor path: prepull-runtime-images.ts owns prerequisite prep for both tiers. Selected PLAN-EVAL round 2 pending.

Independent PLAN-EVAL round 2 PASS_PLAN before CI implementation. Require an exported preparation orchestration used by entrypoint and tests, so removing Garnet preflight fails a meaningful integration control. Verify exact restore argv/manifest/bound/inherited output, propagate nonzero/timeout without retry, and prove a second identical manifest can resolve the restored tool without another restore.

## CI repair local proof

Added explicit pinned Garnet preflight to exported prepareRuntimeTier used by the CLI entrypoint. Focused structured tests: 11 passed, zero failed/ignored. Omitting only the orchestration call makes both tier tests fail (two expected negative failures). Real isolated .NET proof: B's untouched manifest initially cannot resolve Garnet (exit 1); production restoration in A succeeds; B resolves without its own restore (exit 0). Actual cold restore 7179 ms; do not infer that the failed CI necessarily exceeded ten seconds. Static wrappers pass; lint needs root rules copied into an external config without the root's .llm exclusion. Quality:gate passes. See ci-prep-evidence.md.

## CI repair independent sign-off and reconcile

Same separate read-only Claude Opus 5.5 high-effort evaluator round4: PASS, no blockers, substantive slice sign-off before commit. It verifies every plan-round2 requirement against actual process proof/logs and current source. Only existing preparation source/tests change outside the run; production/generator/workflow/readiness/version/lock behavior is unchanged. Preserve source/receipt hashes in the CI repair manifest. Remove the positively owned verification worktree after preserving its mutation. Commit/push this slice now, then use hosted CI and final exact-head review round5; do not mark a red/unproven runtime verdict green.
