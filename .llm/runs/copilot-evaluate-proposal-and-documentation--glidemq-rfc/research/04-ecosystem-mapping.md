# Ecosystem Mapping — GlideMQ concepts → NetScript surfaces

Feature-by-feature projection of the GlideMQ surface onto NetScript's plugins, epics, and ports.
Legend: **A** = adapter concern (comes for free if the GlideMQ adapter ships), **P** = port-level
concept NetScript should own regardless of backend, **R** = design reference only.

## Workers (`plugins/workers` / `plugin-workers-core`)

| GlideMQ | NetScript today | Mapping |
| --- | --- | --- |
| `Queue.add/addBulk`, `Worker` + processor, concurrency | `defineJob`/`defineJobHandler`, `createWorkersRuntime` over `MessageQueue` | **A** — adapter slots under the existing dispatch |
| retries + exponential/fixed/custom backoff, DLQ | `NackOptions` + `DeadLetterStorePort` | **A** (richer backoff strategies **P** — worth port vocabulary) |
| priorities, LIFO, delays | `EnqueueOptions` delayed execution; no priority concept | **P** — priority belongs in `EnqueueOptions` as optional capability with adapter capability-flags |
| global concurrency / rate limiting (sliding window, token bucket, per-group) | none at seam level | **P** — rate-limit port vocabulary; adapters implement or degrade |
| deduplication (simple/throttle/debounce) | worker idempotency claims (`WorkerIdempotencyClaim`) | **P** — dedup modes generalize the existing idempotency seam |
| stalled-job recovery via XAUTOCLAIM | adapter-specific redelivery | **A** |
| `addAndWait` request-reply | none | **R** — interesting for oRPC service layer, defer |
| batch processing, sandboxed processors | none | **R** |

## Sagas (`plugins/sagas` / `plugin-sagas-core`)

| GlideMQ | NetScript today | Mapping |
| --- | --- | --- |
| FlowProducer parent-child trees, DAG (multi-parent, Kahn ordering, cycle detection), chain/group/chord | saga definitions with cascaded effects over redis/list transports | **R** — NetScript's saga model is its own; DAG dependency-resolution + `waiting-children` state are prior art for saga fan-in |
| step jobs (`moveToDelayed` with nextStep) | saga steps | **R** |
| flow budgets (`maxTotalTokens`/`maxTotalCost`, onExceeded fail/pause) | none | **P** — see AI section |

## Triggers / Cron (`plugins/triggers`, `packages/cron`)

| GlideMQ | NetScript today | Mapping |
| --- | --- | --- |
| `upsertJobScheduler` — 5-field cron + timezone, intervals, bounded schedulers | `packages/cron` + workers `cron` helpers | **A/R** — scheduler state lives server-side in GlideMQ (`schedulers` hash); NetScript keeps its own cron seam |

## Streams (`plugins/streams`)

| GlideMQ | NetScript today | Mapping |
| --- | --- | --- |
| Broadcast fan-out (consumer-group-per-subscription, NATS-style subject filtering, per-subscription retries, no XDEL + XTRIM retention) | KV-watch based delivery, durable stream producer | **R** — the per-subscription consumer-group pattern is the strongest available design for a future Redis/Valkey streams adapter |

## AI (`plugins/ai` / `plugin-ai-core` / `packages/ai`) — the highest-value mapping

NetScript's ai plugin has model adapters and a registry but **no durable execution layer**: no cost
tracking, no token streaming persistence, no human-in-the-loop suspend, no failover, no budgets.
GlideMQ's seven AI primitives are exactly that missing layer, and they are queue-level, not
model-level — i.e. they belong at the seam between `plugin-ai-core` and `plugin-workers-core`:

| GlideMQ primitive | Proposed NetScript port concept |
| --- | --- |
| `job.reportUsage()` + `getFlowUsage` + `getUsageSummary` (rolling per-minute buckets) | `UsageRecorderPort` — model/tokens/cost/latency per execution, aggregation across a workflow |
| `job.stream(chunk)` + `queue.readStream` (per-job stream channel, long-poll) | `ExecutionStreamPort` — durable token streaming that survives worker crash; feeds dashboard SSE |
| `job.suspend()` / `queue.signal()` (suspended ZSet + signals list + timeout sweep) | `SuspensionPort` — human-in-the-loop approval for agent workflows |
| `fallbacks` array + `job.currentFallback` | model failover policy in `plugin-ai-core` retry contract |
| `tokenLimiter` (TPM) dual-axis with RPM | `TokenRateLimiterPort` |
| flow `budget` (maxTotalTokens/maxTotalCost, fail-or-pause) | `BudgetPort` on workflow contracts |
| per-job `lockDuration` | execution lease duration on the job contract |
| vector search over job hashes (Valkey Search, KNN) | **R** only — NetScript has embeddings in `packages/ai`; job-hash vector search is backend-exclusive |

These ports can be implemented on **any** backend (Deno KV/Garnet via KV counters + streams-lite),
with GlideMQ as the reference/high-performance implementation. This is the "keep them through an
adapter layer" answer to the proposal's question.

## Telemetry (epic #399)

- Span naming (`glide-mq.queue.add` + `glide-mq.*` attributes) → compare with TC-1..14 messaging
  conventions; NetScript should stay on OTel semconv `messaging.*` where GlideMQ invented its own.
- `setTracer()` bring-your-own-tracer + optional `@opentelemetry/api` peer = same zero-dep default
  philosophy as OF-5's opt-in SDK adapter. Validates the #399 design.
- Server-side minute-bucket metrics with zero extra RTTs → pattern for the T7 query/export surface
  (per-queue counts/durations without client-side scanning).
- `events:false` / `metrics:false` throughput escape hatches → worth mirroring as telemetry config.

## Dashboard (epic #400)

`@glidemq/dashboard` + `@glidemq/hono` are working prior art for the S7 workers console and the
`/_netscript/*` plane:

- REST: `GET /api/queues` (counts+metrics), `GET /api/queues/:name`, job detail incl. logs,
  mutations (pause/resume/drain/retry/clean/obliterate, job remove/retry/promote/changePriority/
  changeDelay, scheduler upsert/remove).
- SSE: `/api/events` lifecycle events incl. `usage`, `suspended`, `budget-exceeded`; per-job
  output stream with `?lastId=` resumption → same replay shape as `/_netscript/flows`.
- Governance: `readOnly` flag + per-action `authorize(req, action)` callback with namespaced
  action strings (`queue:pause`, `job:retry`, `scheduler:upsert`) → directly reusable authz
  vocabulary for #400's gated write-back (acceptance line 2, one-generator-two-callers).
- Anti-pattern flag: the dashboard renders metrics charts and log tails — precisely what #400
  acceptance line 1 assigns to Aspire. Reuse the API/action design, not the screen inventory.

## Hono example → oRPC/service layer

`examples/hono-api/index.ts` shows the pattern: a `QueueRegistryImpl` composition root (connection +
queues + processors + concurrency), middleware injecting the registry into request context, a
mounted queue HTTP API + SSE, and graceful shutdown via `registry.closeAll()`. NetScript's
equivalent: plugin registry generation already builds the registry; a `MessageQueue`-level HTTP
surface in the service layer (oRPC contract routes) would be the port of `glideMQApi()` — and is
effectively what #423 (`/_netscript/*` introspection) plus the S7–S10 thin API slices already plan.
