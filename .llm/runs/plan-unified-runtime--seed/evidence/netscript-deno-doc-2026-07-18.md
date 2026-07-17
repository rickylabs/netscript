# NetScript public-surface `deno doc` extract — 2026-07-18

Commands ran from `/home/codex/repos/wt-g8-seed` on branch
`plan/unified-runtime`.

- `deno doc --filter KvStore packages/kv/mod.ts`: `KvStore` exposes get, set
  with TTL, delete, has, prefix/range list, optional batch get and atomic CAS,
  plus close/async dispose. `WatchableKv` adds key and prefix watch. Root docs
  expose Deno KV and memory; `./redis` is a separate export.
- `deno doc --filter MessageQueue packages/queue/mod.ts`: `MessageQueue`
  exposes enqueue/enqueueMany, a long-running `listen`, graceful stop, delayed
  enqueue options, and a `nativeRetrial` capability flag. The module documents
  Deno KV, Redis, RabbitMQ, validation, retry, delayed delivery, and Aspire
  discovery; the export map additionally ships PostgreSQL and DLQ adapters.
- `deno doc --filter DatabaseAdapter packages/database/mod.ts`:
  `DatabaseAdapter` exposes provider, client, connect/disconnect, health/status,
  and raw execution. The module documents PostgreSQL/MSSQL/MySQL/SQLite,
  Prisma-driver integration, discovery, telemetry, transactions, and pooling.
  The command emitted unresolved cached `@types/node` warnings; the local
  symbol surface was still produced.
- `deno doc --filter FetchHandler packages/service/mod.ts`: `FetchHandler`
  consumes a Web `Request` plus prefix/context and returns matched/response.
  Root module docs say `build()` returns a non-listening mountable `ServiceApp`,
  while `serve()` owns the Deno listener.
- `deno doc --filter createRPCHandler packages/service/mod.ts`:
  `createRPCHandler` returns the structural `FetchHandler` and constructs the
  real oRPC fetch `RPCHandler` internally.
- `deno doc --filter createWorkersRuntime packages/plugin-workers-core/mod.ts`:
  creates an explicit start/stop runtime; root docs expose job, task, workflow,
  cron, state/store, executor, shutdown, telemetry, and testing primitives.
- `deno doc --filter SagaDefinition packages/plugin-sagas-core/mod.ts`:
  a frozen definition includes durability tier, initial state, correlations,
  handlers, compensations, signals, queries, retry, concurrency, and schedule.
- `deno doc --filter SagaStorePort packages/plugin-sagas-core/src/ports/mod.ts`:
  persistence includes state envelopes, optimistic saves, transition history,
  and correlation indexes.
- `deno doc --filter SagaTransportPort .../ports/mod.ts`: start/stop, publish,
  subscribe. `SagaOutboxPort` reserves atomic state/message commit work;
  `SagaIdempotencyPort` reserves durable deduplication keys.
- `deno doc --filter TriggerProcessorPort packages/plugin-triggers-core/mod.ts`:
  processes one unified event and drains on stop. The root surface includes
  schedules, webhooks, file watch, manual/queue/stream events, retries,
  idempotency, DLQ, event store/subscription, enabled state, and backfill.
- `deno doc --filter StreamProducerPort packages/plugin-streams-core/mod.ts`:
  state-protocol producer supports upsert/delete/flush/close. Root docs expose
  typed schemas, durable producers, service discovery, auth, and diagnostics.

