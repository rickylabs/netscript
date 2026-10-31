# Research

Baseline main is `b0b8f3f7282d073d92d64acdee522ea34bba4c5c`. Preflight issue comments and related PR search show #2483 merged; no duplicate listener-concurrency implementation. Current code supersedes early #2395 planning notes: claims now use atomic Lua and Garnet requires scripting and transaction mode. No lease-script rewrite is needed.

- NetScript MCP `find_guidance` then `search_docs` consulted with Redis concurrency/latency intent. Worker API and background resources are separate. Existing tune-worker-runtime page documents WORKERS_CONCURRENCY but no pickup controls.
- `RedisAdapter.listen` ignores concurrency and awaits each handler, polling empty queues every 50 ms and delayed promotion every 1000 ms. Claim/settlement/recovery run on the bounded lease connection. Each claim already carries its own fence and `extendVisibility` context.
- `KvPollingAdapter` is the bounded-concurrency reference, drains up to visibilityTimeout. Native Deno KV already tracks/drains in-flight deliveries; its current dispatch differs from the issue's historical pin. No unrelated adapter behavior changes.
- Worker cancellation begins before listener drain. Existing Redis passes the aborted intake signal into settlement, preventing graceful acknowledgement. Stop currently disconnects immediately. Intake and settlement cancellation need independent lifetimes.
- `plugins/workers/worker/delivery-lease.ts` already owns worker heartbeat. Keep its per-context renewal and Redis atomic fence invariants.
- `TracedQueue` already emits queue.enqueue producer and queue.dequeue consumer spans with propagated parent headers; createQueue auto-wraps when telemetry is enabled. Verify this path with real concurrent Redis rather than adding a second telemetry system.
- Issue Acceptance is prose, with no mirrorable checkboxes. Its live native-refresh/feed-compose p95 requires cockpit deployment and native stimulus unavailable to this framework leaf; report latest owner measurements as context and fresh measurement UNPROVEN, never substitute queue-only p95.
- Memory consulted from prior repository sessions and #2395 run. RTK unavailable; use equivalent plain commands and structured verdict wrappers. Docker daemon unavailable; native run-owned Redis and Garnet executables from previous validated installation are usable. Raw execution details remain outside public source.

## Publish-surface scan

JSR audit rubric applied: two optional, explicitly typed numeric fields on existing ListenOptions; no dependencies or export paths added. Existing Redis subpath exports its port types. Document defaults, integer bounds and semantics; run full queue export-map doc lint, audit-jsr-package, scoped wrappers and quality gate. Export corpus must be regenerated if public declarations change. No slow-type carve-out is planned.
