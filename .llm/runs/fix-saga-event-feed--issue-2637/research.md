# Research

Baseline main b0eb079575968e843b781579673c9fe2ae250e07. Issue2637 has four acceptance boxes.

Confirmed facts: plugins/sagas/services/src/routers/v1-handlers.ts subscribe uses100ms prefix watch, per-connection counter and destructive delete; writeSagaPublishEvent uses random keys. These are the only exact saga-event-prefix writers found outside the forbidden transports. Public SagaSSEEvent types live in the742-line core contracts file; subscribe input has filters, while native oRPC supplies lastEventId separately. KV fixed-key watch initial snapshots are subscribe-first and expose optional ready. Portable CAS exists on all first-party KV implementations; Redis atomic serializes its native WATCH transactions and publishes changes after commit. Redis versionstamps are not ordered across processes, so any ordered feed needs its own identity/counter.

No runtime reproduction yet: findings remain source-verified until the red HTTP/backend tests run. MCP guide confidence was low; literal docs search and focused current source/native API inspection were used.

JSR surface scan: core existing adapters/domain/contracts subpaths can carry one bounded-feed convention; preserve canonical event type identity and avoid new root barrel mirrors or exported Zod types. Existing contract742lines/type closure and folder cardinality debt require measured doc-lint/size baselines. No new dependency planned.


## Genuine current-main HTTP reproduction

New event-feed-http_test.ts executes through the existing real Hono/oRPC saga endpoint, native Deno KV, actual default event writer and native Last-Event-ID header. The unrelated runtime acceptance boundary is an explicit no-op receiver; journal/watch/storage/SSE are real. Four tests fail,0pass/0ignored: a fast client receives all six but a concurrently connected paused reader cannot recover them; a resident client consumes all events while a reconnecting reader cannot replay from its previous id; idle raw native list spy records4enumerations in350ms;300successful publications leave300event keys with no readers. Every test closes its response reader/controller and shared native KV. No new backend/container resource. The initial timer type annotation compile mistake was corrected before this behavioral report and is not product evidence.

Doc-lint baseline measured at unchanged main source: core combined7/private; plugin combined30/private, no missing JSDoc/other. Per-entrypoint raw distributions retained privately. Core contracts742lines, v1 handler330lines, v1 types349lines. New exports must add zero diagnostics and avoid deepening file-size/cardinality debt.
