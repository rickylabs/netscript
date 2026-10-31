# Worklog

## Design

1. Public surface: handler.retry and builder.retry execute as declared; job deadLetters port; durable DLQ depth in health.
2. Vocabulary: JobRetryPolicy, RetryBackoff (fixed/linear/exponential), one initial attempt, retry number starting at one, exhausted job, JobDeadLetterStorePort.
3. Ports: JobRunnerClock, WorkerTaskExecutor, WorkerPool, WorkerExecutionState, WorkerIdempotencyPort, MessageQueue and job dead-letter store.
4. Constants: canonical default max retries, delay, backoff vocabulary and job DLQ namespace; retain DEFAULT_TOPIC and existing queue terminal reason.
5. Commit slices: S1 shared retry and registry contracts; S2 durable DLQ and health; S3 documentation. Per-slice files and gates are in plan.md. Each slice updates this worklog and context pack, commits and pushes.
6. Deferred: listener-supervisor, transport retry redesign, standalone task retries, DLQ admin endpoints. These are independent of job retry acceptance.
7. Contributor path: tune-worker-runtime documents the handler declaration and points to the retry contract and dead-letter extension seam.

## Bootstrap

- Queried feature matrix as JSON. Owner override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
- Branch and clean baseline verified. Assignment file is excluded from commits.
- Issue-specific owner instructions override generic closing-keyword, labels and local E2E guidance: PR starts with Refs, no closing keyword, no label/milestone mutations, no local scaffold.runtime.
- Final publication uses the assignment's atomic .divybot-final-report.md handoff.
- PLAN-EVAL pending; no implementation started.

## PLAN-EVAL round 1

FAIL_PLAN: evaluator required explicit policy precedence/schema and a transport outcome table for shutdown, cancellation and timeout. Plan now makes handler fields authoritative over parsed config defaults, specifies canonical validation and caps, and locks every terminal/requeue outcome. The real-KV shutdown-during-backoff replay test is added. Advisory visibility/claim-TTL risk is recorded. No implementation began.

## PLAN-EVAL round 2

PASS from the same independent evaluator before any implementation. See plan-eval.md. S1 implementation now exercises both real local KV queue adapters; Redis cases follow the CI integration URL contract.

## S1 progress

- New canonical bounded policy resolves handler > metadata > legacy fields > defaults. Both registry generators propagate it. Builder delay is no longer hardcoded.
- Shared executeJobWithRetry owns deno/polyglot attempts and disposable waits; polyglot single-attempt definitions prevent nested retries.
- Shutdown rejection propagates after claim release; the jobs listener no longer swallows a rejected delivery. Existing claim-only test fixtures explicitly use zero retries to keep their original single-attempt scope.
- Initial focused suite: 47 passed, 4 Redis cases ignored because no test URL is configured. Includes real native Deno KV and KV polling, all backoffs, zero retries, polyglot parity, schema bounds and shutdown replay.
- First quality:gate found the pre-existing docs markdown fixture unsafe cast. Fetched main showed its fix already merged as #2480; merged main without rewriting history, then reran the gate. No worker overlap or manual unrelated fixes.
- Expanded suite after updating the registry golden: 113 passed, 4 Redis cases ignored. Independent S1 review found polyglot timeout-status loss and missing production-listener coverage. Timeout results now become terminal TimeoutError; the real-KV shutdown test now drives Worker.start/stop and the actual job listener, then resumes with a second worker.
- Latest retry suite: 11 passed, 4 Redis cases ignored. New timeout regression proves one execution, status timeout and no retry wait.
- doc:lint exposed three new private type references; exporting the retry vocabulary/registration type resolved all three. Two pre-existing contract-type references remain in workers.contract-types.ts; no new documentation-lint debt is introduced.
- S1 independent supervisor re-review: PASS (slice-1-review.md). Preserved upstream TaskResult's string status compatibility at the narrow plugin boundary after the full check caught the upstream's wider type.
- Final S1 regression suite: 114 passed, 0 failed, 4 unavailable Redis integrations ignored; structured check/lint/fmt for all 20 changed TS files: exit 0. Full maintained-source check: 218 files, zero errors. quality:gate: exit 0. JSR package audit: exit 0, dry-run OK; one additional F-16 domain child is recorded as WORKERS-RETRY-DOMAIN-CARDINALITY debt with owner/closing gate.
- Negative controls confirmed the production Worker listener rethrow and polyglot timeout guard independently; zero-retry off-by-one mutant fails both KV cases. All fixed source restored before final gates.
- S1 reconcile: main's #2480 fix is incorporated without worker overlap; issue scope unchanged, no labels/milestones changed, PR remains draft. Continue to S2 only after this slice is committed and pushed.

## S2 progress

- JobDeadLetterStorePort specializes the canonical queue append/list/reprocess/depth contract; Worker defaults it to a distinct KV namespace and exposes it for inspection/reprocess.
- Exhausted returned and thrown failures, timeouts and unroutable jobs await durable append. Shutdown and user cancel do not poison the DLQ. Failed appends propagate through the actual Worker listener after claim release.
- The retry executor reports attempt admission so thrown exhaustion and timeouts retain actual attempt counts.
- Worker.readHealthStatus queries durable depth on each call, including external reprocess changes; storage failure marks dependency readiness unavailable. Compatible async child readers carry that data through the generated background health HTTP route.
- Focused runtime/CLI/health regression: 128 passed, 0 failed, four Redis integrations unavailable. Includes default KV port, real-KV terminal ack ordering, thrown/returned exhaustion, zero retries, storage-outage redelivery, health/reprocess depth, user cancellation, disabled jobs and real HTTP async health transport.
- All four S2 negative controls exited 1 with the intended assertions; fixed files restored afterwards.
- Investigated user-reported command-postgres red. Fresh current main reproduces the same generated-fixture OpenTelemetry logs-export error before test execution. Public links and exact classification are in ci-baseline.md; no unrelated dependency or lock changes made.
- S2 supervisor review: PASS in slice-2-review.md. Closed its thrown-exhaustion advisory by making the two-retry real-KV test throw from the handler; the zero-retry case returns failure. Remaining bounded at-least-once replay/pre-dispatch diagnostics are documented limitations, not blockers.
- Final S2 regression: 135 passed, 0 failed, four unavailable Redis cases ignored. Structured check/lint/fmt over all 14 changed TS files exit 0; quality:gate exits 0; workers plugin JSR audit/dry-run exits 0. Full plugin doc-lint has only the same two inherited contract-type references after exporting all new sibling type dependencies.
- S2 reconcile: no review comments or threads from other authors; command-postgres red confirmed independently on current main. PR remains draft; labels and milestone are coordinator-owned. S3 proceeds only after S2 commit/push.

## CI compatibility correction

- The second command-postgres alert was a distinct PR failure, not main's known dependency error. Its real generated saga consumer builds the existing WorkerDispatchContext shape without deadLetters; the required new field broke that fixture's type check.
- Restored the prior shape with an optional direct-dispatch extension and a lazy canonical KV fallback. Worker still always owns a nonoptional port. A shared composition factory keeps one namespace/default, and omitted injection never bypasses persistence.
- New real-KV direct-consumer test passes; removing only the fallback makes it fail (negative control exit 1). The fixture source remains unchanged. No database/saga behavior or dependency changes are needed.
- Independent compatibility review: PASS. The same correction also preserves the saga publish-order and scheduled-trigger consumer contexts. See compatibility-review.md.
- Incorporated main #2476, which separately fixes the inherited fixture dependency failure. No local lock/config changes remain in this PR's diff against main.
- Post-integration regression: 139 passed, 0 failed, 7 unavailable Redis integrations ignored, including the scheduled-trigger consumers. Focused compatibility check/lint/fmt pass; quality:gate passes on the integrated graph.
- Correction reconcile: prior S2 CI regression is addressed in code; current-head PostgreSQL conformance remains to be observed after push. No listener-supervisor, labels or milestones changed.

## S3 documentation

- tune-worker-runtime now shows schema-backed handler retry and builder declarations, exact count/default/backoff/precedence rules, the KV job DLQ port and replay, durable health, and timeout/cancel/shutdown/lease semantics. Both package READMEs link to the canonical recipe.
- Independent S3 review: PASS. Clarified its advisory that handler policy validates when the generated registry loads, rather than during source emission.
- All three new TypeScript examples compile through the repository snippet compiler. Docs source-format passes; docs:links reports 105 docs with zero broken links, anchors or orphans. No source behavior changed in S3.
- S3 reconcile: all requested implementation scope is delivered; no follow-up issue is needed. Redis integration runs and scaffold.runtime remain CI proof, with the coordinator owning e2e-cli-gate. Exact-head independent IMPL-EVAL is next, then the ready transition and final CI state.

## Ready-state quality correction

- Initial and post-ready independent evaluations approved `a8678d242c99e91a623441959db58821ead9d9b0`; the evaluator independently ran 25 focused regressions. command-postgres was green at that head after both compatibility and main baseline repairs.
- The first ready-state close-gate sampled the final checkbox before its body update; the live gate now passes. Stop the obsolete-head rerun watcher because the docs artifact repair will produce a new head. Update the final checklist before the next ready transition.
- CI quality found the generated CLI/MCP prose carrier stale after the recipe changed. This freshness gate is broader than source/snippet/link checks. Apply `deno task gen:agent-docs-prose`, inspect the deterministic carrier delta, and prove `check:agent-docs-prose` before a new exact-head evaluation. No runtime logic changes are required.
- Canonical prose regeneration changes only the task-router summary, the background how-to index and tune-worker-runtime's compressed page. Freshness check passes, and all three prose-generator tests pass.
- Test shard 4's two failures both arise from the stale MCP public export corpus: the clean-tree generation byte comparison and the freshness-only dirty-read-set test. The aggregator merely reports that shard failure. Regenerate the canonical export corpus from the reviewed committed source, then run its tests; do not weaken either freshness check.

## Augment review corrections

- Comment 4429701184: direct DLQ fallback identity now uses the canonical job-scoped idempotency resolver. Real KV stores two different jobs sharing a caller key while preserving same-job append deduplication.
- Comment 4429701186: an active, unapplied duplicate claim is deferred by rejection/requeue rather than acknowledged. A real-KV replay test holds the original terminal claim release, verifies replay retains the durable record, then completes once release is allowed. An already-applied duplicate still acknowledges normally.
- Comment 4429701189: fatal state and shutdown timing are established synchronously. Optional diagnostic enrichment never gates completion, and pending health reads are interrupted on fatal/stop so HTTP draining cannot hang on a stalled snapshot. A real HTTP regression uses a never-settling reader.
- Focused correction suite: 23 passed, 4 unavailable Redis integrations ignored. Each review correction has a fix-reverted negative control, restored before final gates.
- Independent corrections review: PASS; evaluator independently ran 44 focused tests, zero failures, four unavailable Redis cases skipped. Full local regression now passes 142 tests, with seven Redis integrations unavailable. Structured check/lint/source-fmt pass, and quality:gate passes.
- The prose carrier is intentionally excluded by the nearest CLI formatter config. The structured formatter correctly refused partial coverage, so it was checked separately with the same root formatting settings and no exclusion; that explicit generated-file check passes. No formatter suppression or file mutation was added.
- Commit these reviewed sources and the regenerated prose now; then regenerate the public export corpus from the required clean package/plugin read set before marking ready again.

## Export corpus correction

- Sources and prose were committed and pushed as `15608953cf8329da36227f93151f70986c4c18c5`. All three review threads now have replies; the repository thread gate passes with zero unanswered threads.
- Regenerated the canonical MCP export corpus from that clean committed source. Only four generated rows change: workers runtime/worker and workers-core builders/runtime. Freshness reports 35 packages, 301 subpaths, 8,941 symbols and SHA-256 `8db7224a5a2a512f08257918de0e21c48ac66d25e36e053ddcc8d9d7b104c761`.
- Independent export-corpus review: PASS. The evaluator independently ran the freshness check; structured type and explicit generated-file format checks also pass. No locks or runtime source change in this slice.
- The generator tests deliberately clone committed HEAD. A pre-commit run confirmed it still sees the old artifact (12 passed, two stale-corpus failures); this is not evidence against the uncommitted refresh. Commit and push the reviewed artifact before the decisive rerun.
- Reconcile: original implementation scope is complete, all review findings addressed, PR temporarily draft. New-head CI and exact-pushed-head evaluation remain before READY; scaffold.runtime remains coordinator-owned and unproven.
