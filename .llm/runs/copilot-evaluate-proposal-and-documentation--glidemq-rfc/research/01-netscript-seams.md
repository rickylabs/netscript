# NetScript Seam & Plugin Map (baseline for the GlideMQ evaluation)

Facts verified against the working tree at baseline `2779fb24` (2026-07-09). Every claim below was
checked by direct file inspection; paths are repo-relative.

## 1. The queue seam — `@netscript/queue` (`packages/queue`, Archetype 2)

**Contract:** `MessageQueue<T>` (`packages/queue/ports/message-queue.ts`) — `enqueue`, `listen`,
ack/nack with `NackOptions` (requeue, terminal `DeadLetterReason`, errorCode/errorMessage).
Factories: `createQueue`, `createTypedQueue` (Zod-validated), `createParallelQueue`
(`packages/queue/factory/`). Wraps Fedify's battle-tested queue adapters with a unified interface.

**Providers** (`packages/queue/ports/options.ts` `enum QueueProvider` + `packages/queue/adapters/`):

| Provider | Adapter file | Positioning (from source docs) |
| --- | --- | --- |
| `deno-kv` | `deno-kv.adapter.ts`, `kv-polling.adapter.ts` | zero-config default, dev/single instance, < 1000 msg/s |
| `redis` | `redis.adapter.ts` | production, > 10,000 msg/s, pub/sub |
| RabbitMQ (AMQP) | `amqp.adapter.ts` | enterprise routing/reliability |
| Postgres | `postgres.adapter.ts` | DB-backed queue |

**Dead-letter seam:** `DeadLetterStorePort` (`ports/dead-letter.ts`) with KV / Redis / Postgres
stores (`kv-dead-letter-store.ts`, `redis-dead-letter-store.ts`, `postgres-dead-letter-store.ts`).
This is also the co-requisite surface for dashboard S12 (#553, #555).

**Discovery:** Aspire environment variables (`services__*`, `ConnectionStrings__`) resolved inside
`factory/create-queue.ts`; no hardcoded backends (composition-root law).

## 2. The KV seam — `@netscript/kv` (`packages/kv`, Archetype 2)

**Contract:** `WatchableKv` (CRUD + `watch`/`watchPrefix`). Adapters in `packages/kv/adapters/`:
`deno-kv.adapter.ts`, `denokv-bridge.ts`, `redis.adapter.ts` (+ `redis/` connection/types),
`memory.adapter.ts`, `kvdex.ts`. Redis gives pub/sub watch; Deno KV Connect falls back to polling.
Provider selection via `CACHE_PROVIDER` override then env/Aspire discovery
(`application/auto-detect.ts`).

**Garnet** is a first-class cache/KV provider: `packages/cli/src/kernel/constants/providers.ts`
declares `GARNET: 'garnet'` with a `garnet://` URL scheme; `packages/kv` handles Garnet via the
Redis-compatible adapter path.

## 3. Plugin consumers of the seams

| Plugin | Core package | Seam usage |
| --- | --- | --- |
| `plugins/workers` | `packages/plugin-workers-core` | `defineJob`/`defineTask`/`defineWorkflow`/`defineJobHandler`, `createWorkersRuntime`, `startWorkers`; jobs dispatched over `MessageQueue`; cron via `packages/cron`; idempotency claims (`WorkerIdempotencyClaim`); telemetry reference implementation |
| `plugins/sagas` | `packages/plugin-sagas-core` | Durable sagas with **two transports** (`src/transports/`): `redis-transport*.ts` (Redis Streams) and `list-transport*.ts` — an explicitly **Garnet-compatible saga transport using Redis LIST operations** (`GarnetListTransportOptions`, `resolveGarnetListTransportOptions`). KV-backed `SagaStorePort`, idempotency store, clock port |
| `plugins/triggers` | `packages/plugin-triggers-core` | event/trigger firing over queue/KV seams; known W3C trace-parenting bug (fixed under #399 T4) |
| `plugins/streams` | `packages/plugin-streams-core` | KV-backed event state + pub/sub delivery; durable stream producer |
| `plugins/ai` | `packages/plugin-ai-core` + `packages/ai` | provider adapters (anthropic, openai-compatible, openrouter, ollama, mcp, embeddings), model registry (`ModelRef`/`ModelHandle`/`ModelDescriptor`), tools; **no queue/KV usage today** — no durable job semantics, cost tracking, token streaming, budgets, or failover chains |

**The list-transport is the smoking gun for backend policy:** NetScript already pays an
extra-engineering cost (a second, feature-reduced transport) specifically to keep Garnet viable when
a backend lacks Redis Streams. Any new queue technology must respect the same law: capability lives
behind a port; degraded-but-working fallbacks stay available.

## 4. Telemetry — `packages/telemetry` (+ epic #399)

Ports/adapters package with `TracerProviderPort`/`MeterPort`/`PropagatorPort`, instrumentation
wrappers per seam (`src/instrumentation/queue.ts`, `worker.ts`, `scheduler.ts`, `saga.ts`,
`orpc.ts`), context propagation (`getParentContextFromHeaders`, `injectContext`), and subpath
exports `./otel`, `./query`, `./orpc`. Epic #399 (beta.6) lands the TC-1..14 convention, the
opt-in OTel SDK adapter (`NETSCRIPT_TELEMETRY_PROVIDER`), fan-in span-links, and the
`@netscript/telemetry/query` contract the dashboard consumes.

## 5. Dev dashboard — epic #400 (beta.7)

`plugins/dashboard` + `packages/plugin-dashboard-core` on `@netscript/fresh-ui`. Owns
NetScript-domain state only (acceptance line 1: never re-render OTLP; deep-link Aspire/Scalar).
Data plane: `/_netscript/*` introspection + `/_netscript/flows` SSE. Screens S7–S10 are the
Workers/Sagas/Triggers/Streams consoles (create → configure → monitor → act); S12 is Dead-Letter
Queues (deferred, gated on #554/#555).

## 6. Benchmarks — what exists today

- `packages/bench` (`@netscript/bench`) is the **agent self-bench instrument** — it scores how well
  a *coding agent* builds a NetScript service (frozen HTTP suite, sandbox, scoring). It is **not** a
  seam/queue performance benchmark.
- The seam performance benchmark that informed the original queue/KV seam design lived in the
  legacy repo `rickylabs/netscript-start/tree/master/benchmark`. That repo returns **404 via the
  GitHub API from this sandbox** (private or removed) — the benchmark suite has no successor in
  this repo. This gap is the subject of the issue draft in `issue-draft-benchmark.md`.

## 7. Doctrine constraints that bind this evaluation

- **Archetype 2 (Integration):** provider-agnostic integration, multiple adapters behind stable
  ports — the queue seam is the canonical example. A new backend enters as an adapter, never as a
  contract rewrite.
- **Archetype 5 + thinness law** (`docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`):
  capability lives in `-core` siblings; plugins stay thin glue. AI-native job features would live in
  `plugin-workers-core`/`plugin-ai-core` port contracts, not in a plugin.
- **Wrap, don't reinvent** (AGENTS.md rule 3): prefer upstream APIs behind local ports.
- **Aspire-first discovery:** any new backend must be resolvable from Aspire env, and scaffold
  generation (`packages/cli`) must know how to provision it (a Valkey container resource).
