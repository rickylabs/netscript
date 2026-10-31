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
