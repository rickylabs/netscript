# Plan & Design — READY FOR REVIEW

Archetype5 plugin, containing archetype3 runtime supervision; service/docs overlays. Doctrine08 governs time, abort, explicit failure; existing workers Refactor debt remains, no new layering/dependency changes. Focus AP8 time seam, AP10 lifecycle, AP14 core reuse, AP25 injected effects. Reuse ChildHealthMonitor and existing now/sleep rather than introduce a new scheduler or copy health state machinery.

## Locked decisions

- Add WorkerOptions.listenerHealthyResetMs (default60000ms). Internal supervisor option healthyResetMs. Require finite positive window (RangeError on invalid values, resolved in the Worker constructor before resources start and independently in the internal supervisor through one policy resolver). Existing listenerMaxRestarts number behavior remains compatible; document nonnegative integer or positive Infinity usage, default3, without adding unrelated validation. Backoff stays capped; zero base delays remain allowed for tests/explicit low latency. A full uninterrupted run replenishes the burst budget; backoff/waiting is not healthy time. Reset on failure before the budget comparison and when reading a running snapshot, without a permanent reset timer. Use the existing injected now seam, monotonic performance.now by default for supervisor elapsed durations; ChildHealthMonitor keeps its epoch clock by default.
- Preserve existing published listener.restartCount and childHealth.restartCount as cumulative counters and existing log semantics. Add restartBudgetUsed for the resettable burst budget (bounded by configured max); explicitly document the new field in WorkerHealthStatus and WorkerListenerSnapshot. Aggregate Worker childHealth continues summing cumulative listener.restartCount. This additive API avoids changing the meaning of a published field. Existing crash-loop health needs its own60s regardless of a shorter configured restart reset.
- Add a credential-safe failureCause union (store-write-refused, connection-unavailable, listener-error) and fixed category message in listener childHealth.lastFatalError. Recognize backend OOM/READONLY/NOPERM and connection failures from errors/causes, never echo input, stacks, URLs or arbitrary class names. Preserve raw error only in existing local lastError/onFailure path. No core health type modification; ChildFatalError.message already supports safe fixed category text. Retain latest category as historical incident on recovery.
- Wire the window to jobs/tasks/triggers and document constructor-only Worker knobs, Infinity mode and separate crash-loop health recovery. No invented defineWorkers config fields.

## Slices

0. Bootstrap this run and draft PR (run artifacts only).
1. Add option and health contract, supervisor reset/failure category, worker/queue-consumer wiring, regressions and docs. Files: plugins/workers/worker/{listener-supervisor.ts,listener-supervisor_test.ts,listener-recovery_test.ts,worker-listener-health_test.ts,worker-options.ts,worker.ts,queue-consumer.ts,mod.ts}; docs/site/background-processing/how-to/tune-worker-runtime.md; this run directory. Gates: scoped checks/lint/fmt; supervisor tests (spaced failures, burst exhaustion, cap, Infinity, boundary, shutdown and category safety); public Worker wiring tests for all listener families; real local KV failure/reopen and actual Redis ACL-refusal/recovery; negative controls with old supervisor; quality/arch; consumer import/doc lint/JSR audit; member publish dry-run. Independent slice signoff before commit.
2. Only if current-head CI requires a scoped repair; separate evidence and exact-head review again.

## Gate/evidence policy

PLAN-EVAL selected per coordinator brief before code. Same independent Opus5.5/high read-only session across rounds, max2 plan/max5 impl. Source/test verdicts from structured wrappers, durable receipts where allowlisted. Negative controls must fail when the old reset implementation is restored. Test existing local KV queue isolation and worker runtime/concurrency fixtures. Redis integration is environment-gated like existing suites; local evidence must explicitly run it with a real server (not ignored). No local scaffold.runtime; request coordinator CI gate if runtime wiring needs it. Exact integration invocation: `NETSCRIPT_TEST_REDIS_URL=<private test server URL> deno run -A .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv plugins/workers/worker/listener-recovery_test.ts`. It must run the Redis case locally (no ignored proof). `listener-recovery_test.ts` uses an actual RedisAdapter queue.listen: ACL denial/restoration of BRPOPLPUSH, successful message acknowledgements between outages, fake elapsed running time beyond listenerHealthyResetMs, >maxRestarts total refusals and actual post-recovery delivery. The test coordinates on queue/listener promises and Redis processing state; never rely on a150ms wall-clock window. It also exercises actual local DenoKvAdapter write refusal on a closed handle then reopen in a fresh supervised attempt. Old never-reset budget is the negative control for both.

`worker-listener-health_test.ts` exercises jobs/tasks/triggers via public Worker plus controlled queue seams and injected default clock. Every family must project the fixed category text into worker.healthStatus.childHealth.lastFatalError.message (the onStarted HTTP route surface), serialize without secret/URL/stack, retain cumulative aggregate restartCount after restartBudgetUsed resets, and respect configured window. `listener-supervisor_test.ts` adds deterministic per-window/cap/Infinity/abort/category tests.

No dependency/lock/version changes intended. Public-only sanitized run records, raw logs private. Final exact-head verdict after push and CI.

## Risks and mitigations

Clock rollback: elapsed duration uses monotonic default, injected fake epoch is acceptable tests; backoff never counted. Concurrent snapshots: single JS event loop; resets are idempotent and cannot resurrect failed/stopped state. False-green storm: keep shared60s crash-loop monitor and cumulative counters. Secret leakage: category allowlist and fixed messages with serialization assertions. Resource leaks: abort and await all listeners; existing RedisAdapter.listen attaches an abort callback per attempt to the shared signal; recorded preexisting queue-adapter risk, not broadened into queue-adapter changes here; close DenoKV handles/queues; delete only isolated Redis ACL user/queue keys. Shared resources: no CONFIG/global state mutation; existing foreign resources left alone. Concurrent #2144 ownership: no dispatcher/execution edits and rebase/merge ordinarily if needed.

Open decisions: none requiring owner choice. CLI child-health-reader currently normalizes incident messages to generic redacted text; preserving the safe category through CLI/Aspire readers is deferred. Claim is specifically HTTP health and Worker snapshots, not CLI category propagation. Deferred: all queue visibility/concurrency semantics (#2395/#2351), job retry/DLQ (#2144), logging overhaul (#2392), core/plugin restructuring and existing doc debt. No labels/milestones/merge/tag/release. Coordinator owns main verification and E2E arming.

## Resume proof adaptation

Current main uses receipt-fenced Lua claims. For the existing real Redis proof,
replace the obsolete BRPOPLPUSH ACL denial with isolated EVAL/EVALSHA denial. Ack
successful deliveries before gating the next claim; enqueue pending work before
the denied attempt, require fixed cause, restore rights in backoff, then require
the next delivery. This preserves the approved refusal/recovery acceptance.
Add typed QueueConnectionError coverage using its existing CONNECTION_FAILED
contract, both directly and under Error.cause, for review4429709762. Scope and
public categories are unchanged; no further planning decision or new PLAN round.
