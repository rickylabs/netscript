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
