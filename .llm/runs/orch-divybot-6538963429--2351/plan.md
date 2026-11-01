# Plan & Design — READY FOR REVIEW

Feature tier; supplied leaf profile; Archetype 3 runtime/behavior, integration concern folded inside; docs overlay. Existing queue folder debt is accepted upstream; add one cohesive private Redis admission/drain module and update the existing adapters-cardinality debt for its navigation cost. Keep redis.adapter.ts below 500 lines. PLAN-EVAL is required by owner and must PASS before code.

## Locked decisions

1. Add Redis-specific optional `ListenOptions.pollIntervalMs` and `delayedPollIntervalMs`. Each is an integer 10–60000 ms, defaults 50 and 1000 respectively. Explicit options override `NETSCRIPT_REDIS_QUEUE_POLL_INTERVAL_MS` and `NETSCRIPT_REDIS_DELAYED_POLL_INTERVAL_MS`, then defaults. Concurrency must be a positive safe integer at most 2147483647, otherwise QueueConfigurationError before allocating sockets. Read env only in Redis edge; malformed/out-of-range values fail with the originating variable name. If Deno.env.get throws Deno.errors.NotCapable, use defaults so existing direct consumers with scoped env permissions remain compatible; explicit options never read env. Other errors propagate. Validate before allocating sockets. Other adapters ignore these provider-specific options; do not alter their implementation. Generated workers inherit env tuning through their existing createQueue/listen route with no scaffold edits.
2. One claim loop, bounded Set of handler-plus-settlement promises; at capacity await first completion or intake cancellation. Never preclaim N+1. Handler errors nack the failed claim and wake/stop intake, drain siblings then propagate to existing listener supervision. No swallowed errors or unhandled detached rejections.
3. Separate intake and settlement abort lifetimes. Abort stops new admission immediately; a claim already committed is always dispatched and drained, including a claim returned after intake abort. Never nack a claim whose handler has not run: at the final delivery that could dead-letter unseen work. Keep the lease connection and delayed retry capability available for a bounded drain, then abort settlement and stop that lease generation. Drain budget is listener visibilityTimeout (default 30000 ms), matching KV polling reference. `stop()` shares completion, awaits listener drain before closing connections. Calling and awaiting stop from inside that same handler waits at most the same drain budget; it cannot await its own successful completion. Preserve the existing stop-inside-handler fixture as an expired-drain recovery guard. The budget begins at abort/failure/stop, also bounds pending claim IO, and applies to handler-error sibling drain. At expiry stop that lease connection generation and refuse late ack/nack/extendVisibility; leave durable unsettled claims for reclaim.
4. Preserve unique lease receipts, atomic scripts, reclaim and per-context extendVisibility. Existing worker heartbeat continues independently for each concurrent delivery. The queue does not introduce automatic heartbeats. No automatic infinite renewal by the queue.
5. Idle healthy ready-message pickup adds at most pollIntervalMs plus command/event-loop overhead. Delayed eligibility adds at most delayedPollIntervalMs + pollIntervalMs plus overhead when a slot is available, promotion backlog fits its existing bounded pass, and backend/clock are healthy. Queue saturation/outages/backlog and synchronous work are excluded and documented. Reclaim cadence remains independent.
6. Existing TracedQueue is the single tracing seam. Verify exact enqueue/dequeue parentage across concurrent real Redis deliveries using the current telemetry test recorder. Document enablement; no second wrapper.

## Placement

- `_redis-listener.ts`: one per-listen Redis-specific bounded admission/drain state owner. It composes RedisLeases, deliver callback and resolved listener policy; owns intake/settlement cancellation and first failure. No generic pool or new public export.
- `_redis-lease-state.ts`: extend existing policy validation with concurrency and polling/environment resolution; types stay explicit and JSR-safe.
- `redis.adapter.ts`: delegates the listen lifecycle, owns delayed/recovery timers and adapter sockets, shares stop completion. Stay below 500 lines.
- Extend existing redis-lease-cardinality entry in `.llm/harness/debt/arch-debt.md` from 19 to 20 children, with this plan link and one-module navigation cost. No new exclusions or cap increases.

## Ordered slices and gates

- S0: tracked research/design/run record; independent PLAN-EVAL; commit/push draft PR immediately.
- S1: port docs, private Redis listener/policy, Redis adapter dispatch/cancellation/timers and existing cardinality debt update, queue README, tune-worker-runtime, concurrency/lifecycle/config tests (existing stop-inside-handler fixture preserved). Gates: structured queue check/test/lint/fmt; quality:gate; independent slice review before sign-off; update worklog/context, commit and push.
- S2: real Redis and Garnet crash-with-N, independent heartbeats/fences, capacity/serial/slow-fast, bounded drain/abort races, measured idle and delayed pickup, telemetry correlation tests and reverted-production negative controls. Regenerate required public declaration/doc carriers through native tools only. Gates: complete queue tests plus worker Redis lease regressions and telemetry consumer test, scoped wrappers, doc lint, JSR audit, quality gate and generator freshness. Independent IMPL-EVAL, commit/push evidence, mark ready after no blockers, final same-session evaluation of exact pushed head. Request coordinator scaffold.runtime CI verdict in READY; do not run it locally.

## Proof and negative-control matrix

Use structured run-deno-test.ts with both real backend env vars. Run the exact new test files against a private isolated source copy containing the fixed tests and main production adapter/policy, using --no-check only for behavioral negative controls so missing new optional fields do not substitute for runtime failure. Never commit reverted production. Publish sanitized test names, assertion failures, durations/counts and measurement summaries only. Existing compatibility tests are expected to remain green on baseline, not falsely claimed as distinguishing regressions.

| Test/invariant | Production negative control | Required failure |
| --- | --- | --- |
| N active, N+1 ready, serial at 1, fast sibling before slow release | baseline serial await | N simultaneous barrier or fast receipt times out |
| Abort drains successful siblings and stop waits for ack | baseline aborted settlement signal / immediate disconnect | processing list remains nonempty or stop resolves before barrier |
| Hung delivery drains within visibility budget; replacement sees count 2 | pre-fix unbounded listen-await / immediate stop | stop/listen completion or drain lower-bound assertion fails; baseline existing crash tests remain compatibility controls |
| Claim commits at final delivery during abort and handler still runs | baseline post-claim throwIfAborted | handler never runs, claim remains unsettled; no false DLQ success |
| Concurrency/env/interval invalid values fail before socket allocation; denied env permission defaults | baseline ignores config | expected QueueConfigurationError missing / chosen effective values wrong; denied-env compatibility may pass baseline |
| Healthy ready/delayed pickup bound with configured small intervals | baseline 50/1000 ms constants | measured delayed pickup exceeds configured bound; ready test uses an intentionally large/small configured wait and synchronized empty-poll barrier |
| N heartbeats live, no competing double delivery, crash N then replacement count 2 | baseline serial await with unchanged leases | initial N claim barrier fails; existing single-claim fence tests remain compatibility controls |
| Concurrent real-backend producer/consumer trace parentage | baseline serial dispatch | second receipt cannot arrive while first held; trace parenting after that uses existing wrapper |

Stop invariants are explicit: a handler that finishes during drain is acknowledged once and cannot be reclaimed; a handler still running beyond budget leaves a recoverable claim and stop/listen resolve within budget plus command/scheduling overhead. In-handler await stop follows the latter bounded path and never implies successful ack. Ambient/deploy env supplies tuning vars; generated defaults and deploy .env injection are unchanged.

## Risks and mitigations

- Claim completes after abort: dispatch it with its committed receipt and drain; never orphan through throwIfAborted or consume a delivery budget without running its handler.
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
