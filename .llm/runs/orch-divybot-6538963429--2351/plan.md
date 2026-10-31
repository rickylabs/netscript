# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf profile; Archetype 3 runtime/behavior, integration concern folded inside; docs overlay. Existing queue folder debt is accepted upstream, no new folder/module needed. PLAN-EVAL is required by owner and must PASS before code.

## Locked decisions

1. Add Redis-specific optional `ListenOptions.pollIntervalMs` and `delayedPollIntervalMs`. Each is an integer 10–60000 ms, defaults 50 and 1000 respectively. Explicit options override `NETSCRIPT_REDIS_QUEUE_POLL_INTERVAL_MS` and `NETSCRIPT_REDIS_DELAYED_POLL_INTERVAL_MS`, then defaults. Read env only in Redis edge, validate before allocating sockets. Other adapters ignore these provider-specific options; do not alter their implementation. Generated workers inherit env tuning through their existing createQueue/listen route with no scaffold edits.
2. One claim loop, bounded Set of handler-plus-settlement promises; at capacity await first completion or intake cancellation. Never preclaim N+1. Handler errors nack the failed claim and wake/stop intake, drain siblings then propagate to existing listener supervision. No swallowed errors or unhandled detached rejections.
3. Separate intake and settlement abort lifetimes. Abort stops new admission immediately; claimed work already committed is either dispatched and drained or explicitly requeued. Keep the lease connection and delayed retry capability available for a bounded drain, then abort settlement and stop that lease generation. Drain budget is listener visibilityTimeout (default 30000 ms), matching KV polling reference. `stop()` shares completion, awaits listener drain before closing connections. Calling and awaiting stop from inside that same handler is recursive drain; adjust the existing test fixture to request stop outside the handler.
4. Preserve unique lease receipts, atomic scripts, reclaim and per-context extendVisibility. Existing worker heartbeat continues independently for each concurrent delivery. No automatic infinite renewal by the queue.
5. Idle healthy ready-message pickup adds at most pollIntervalMs plus command/event-loop overhead. Delayed eligibility adds at most delayedPollIntervalMs + pollIntervalMs plus overhead when a slot is available, promotion backlog fits its existing bounded pass, and backend/clock are healthy. Queue saturation/outages/backlog and synchronous work are excluded and documented. Reclaim cadence remains independent.
6. Existing TracedQueue is the single tracing seam. Verify exact enqueue/dequeue parentage across concurrent real Redis deliveries using the current telemetry test recorder. Document enablement; no second wrapper.

## Ordered slices and gates

- S0: tracked research/design/run record; independent PLAN-EVAL; commit/push draft PR immediately.
- S1: port docs, Redis bounded dispatch/cancellation/timers, queue README, tune-worker-runtime, concurrency/lifecycle/config tests and fixture updates. Gates: structured queue check/test/lint/fmt; quality:gate; independent slice review before sign-off; update worklog/context, commit and push.
- S2: real Redis and Garnet crash-with-N, independent heartbeats/fences, capacity/serial/slow-fast, bounded drain/abort races, measured idle and delayed pickup, telemetry correlation tests and reverted-production negative controls. Regenerate required public declaration/doc carriers through native tools only. Gates: complete queue tests plus worker Redis lease regressions and telemetry consumer test, scoped wrappers, doc lint, JSR audit, quality gate and generator freshness. Independent IMPL-EVAL, commit/push evidence, mark ready after no blockers, final same-session evaluation of exact pushed head. Request coordinator scaffold.runtime CI verdict in READY; do not run it locally.

## Risks and mitigations

- Claim completes after abort: retain and settle that claim; never orphan through throwIfAborted.
- Abort prevents ack: separate signals and bounded settlement drain.
- Handler rejects while idle/full: retain first failure and wake intake; always await/catch each task.
- Stop disconnects heartbeats early: keep connection through drain; fence/stop old generations at budget expiry.
- Hung handler: finite visibility-based drain budget; no claim release that allows a late stale handler ack.
- Slow Garnet startup or unavailable container daemon: use independently owned native backend processes, no foreign mutation.
- Timing tests flaky: readiness/barrier-based assertions and measured overhead allowance, no sleeps as proof of successful delivery; negative control must fail under same allowance.
- Public artifacts contain machine context: sanitized reports only; raw prompts/logs in private project runs.
- Existing doc corpus near size cap: run generators and report real failures; never weaken budgets.

## Open decisions / deferred scope

No implementation-blocking choices open. Fresh cockpit native-refresh/feed-compose measurement is safe to defer to coordinator deployment, marked UNPROVEN in READY. Do not change native file observers, cockpit, other adapter semantics, lease atomic scripts, worker heartbeat policy, release/merge/labels/milestones. e2e-cli scaffold.runtime verdict is coordinator-owned and remains unproven until CI runs.
