# Worklog — feat-package-quality-wave2-adapters--adapters

## Design checkpoint (per ARCHETYPE-2)

### Public surface

| Unit | Entry points | Subpaths | `./testing` |
|------|-------------|----------|-------------|
| logger | `mod.ts` | `./middleware`, `./orpc` | N/A (facade) |
| telemetry | `mod.ts` | `./config`, `./tracer`, `./context`, `./attributes`, `./instrumentation`, `./registry`, `./orpc` | N/A (facade) |
| aspire | `mod.ts` | `./config`, `./schema`, `./types`, `./constants`, `./application`, `./adapters`, `./testing` | ✓ (exists) |
| kv | `mod.ts` | `./redis`, `./kvdex`, `./testing` (new) | Planned |
| database | `mod.ts` | `./ports` (was `./interfaces`), `./adapters`, `./adapters/postgres`, `./adapters/mssql`, `./adapters/mysql`, `./extensions`, `./scripts`, `./tracing`, `./testing` (new) | Planned |
| prisma-adapter-mysql | `src/mod.ts` | (single export) | N/A (single adapter) |
| queue | `mod.ts` | `./adapters/deno-kv`, `./adapters/redis`, `./adapters/amqp`, `./adapters/kv-polling`, `./ports` (was `./types`), `./errors`, `./validation`, `./testing` (new) | Planned |
| cron | `mod.ts` | `./adapters`, `./ports` (was `./types`), `./testing` (new) | Planned |

### Domain vocabulary

#### logger
- `LogLevel`: `'debug' | 'info' | 'warn' | 'error'`
- `LoggerConfig`: sink + level + formatter
- `createLogger(config)`: composition root
- No port/adapters split — single facade over `@logtape/logtape`

#### telemetry
- `Span`, `SpanContext`, `TraceState`: re-exported from `@opentelemetry/api` with explicit types
- `TracerConfig`: OTEL endpoint + resource attributes
- `createTracer(config)`: composition root
- Instrumentation registry: `./registry` subpath

#### aspire
- `AspireResource`, `ContributionContext`, `EnvSource`: domain types
- `AspireBuilderPort`, `AspireRuntimePort`: ports
- `MemoryAspireBuilder`: in-memory adapter (testing)
- `createAspireBuilder(config)`: composition root
- Schema exports: explicit `z.ZodType<T>` annotations to fix doc-lint

#### kv
- `KvStore`, `WatchableKvStore`: port contracts
- Adapters: `DenoKvAdapter`, `RedisAdapter`, `KvdexAdapter`
- `createKvStore(config)`: composition root (auto-detect backend)
- `MemoryKvStore`: in-memory adapter (testing)
- Folder rename: `bridges/` → `adapters/`, `core/` → `application/`

#### database
- `DatabaseAdapter`, `DatabaseConnectionOptions`, `TransactionOptions`: port contracts
- Adapters: `PostgresAdapter`, `MssqlAdapter`, `MySqlAdapter`
- `createDatabaseAdapter(config)`: composition root
- `MemoryDatabaseAdapter`: in-memory adapter (testing)
- Extensions: `sqlJsonExtension`, `mssqlJsonExtension`, `mysqlJsonExtension`

#### prisma-adapter-mysql
- `PrismaMySqlAdapter`, `PrismaMySqlAdapterFactory`: single-adapter package
- `convertDriverError`, `mapColumnType`, `mapArg`, `mapRow`: conversion helpers
- No port split (single adapter, no second credible adapter)

#### queue
- `MessageQueue`, `EnqueueOptions`, `ListenOptions`: port contracts
- Adapters: `DenoKvQueueAdapter`, `RedisQueueAdapter`, `AmqpQueueAdapter`, `KvPollingQueueAdapter`
- `createQueue(config)`, `createTypedQueue(config)`, `createParallelQueue(config)`: composition roots
- `MemoryQueueAdapter`: in-memory adapter (testing)
- Folder rename: `interfaces/` → `ports/`, `utils/` → `validation/`

#### cron
- `CronScheduler`, `JobHandler`, `ScheduleOptions`: port contracts
- Adapters: `DenoCronAdapter`, `MemoryCronAdapter`
- `createScheduler(config)`: composition root
- `MemorySchedulerAdapter`: in-memory adapter (testing)
- Folder rename: `interfaces/` → `ports/`

### Ports

| Unit | Port file | Consumed by |
|------|-----------|-------------|
| kv | `types/kv-store.ts` (domain types act as port) | `queue` (via `@netscript/kv`) |
| database | `ports/database-client.ts` | CLI scaffold templates (future) |
| queue | `ports/message-queue.ts` | `plugins/workers`, `plugins/triggers` |
| cron | `ports/scheduler.ts` | `plugins/triggers`, `plugins/workers` |
| aspire | `src/ports/aspire-builder-port.ts` | `packages/cli`, generated projects |
| telemetry | `src/core/types.ts` (re-export contract) | `packages/aspire`, `plugins/*` |

### Composition roots

| Unit | Factory | Location |
|------|---------|----------|
| logger | `createLogger` | `creators.ts` (root) |
| telemetry | `createTracer` | `src/core/tracer.ts` |
| aspire | `createAspireBuilder` | `src/application/mod.ts` |
| kv | `createKvStore` | `application/auto-detect.ts` (was `core/auto-detect.ts`) |
| database | `createDatabaseAdapter` | `application/create-database.ts` (new) |
| queue | `createQueue`, `createTypedQueue`, `createParallelQueue` | `factory/create-queue.ts`, `factory/create-typed-queue.ts`, `factory/create-parallel-queue.ts` |
| cron | `createScheduler` | `mod.ts` (root) |

### Required permissions

| Unit | `--allow-*` | Documented in README? |
|------|-------------|----------------------|
| logger | `--allow-env` (config) | Planned |
| telemetry | `--allow-net` (OTEL endpoint) | Planned |
| aspire | `--allow-read` (env files), `--allow-env` | ✓ |
| kv | `--allow-net` (Redis), `--allow-read`/`--allow-write` (Deno KV file) | Planned |
| database | `--allow-net` (DB connections) | Planned |
| prisma-adapter-mysql | `--allow-net` (MySQL) | Planned |
| queue | `--allow-net` (Redis/AMQP), `--allow-read`/`--allow-write` (Deno KV) | Planned |
| cron | `--allow-net` (Deno Cron remote triggers) | Planned |

### Consumer-import impact

| Change | Affected consumers | Mitigation |
|--------|-------------------|------------|
| `aspire` drops `./helpers` | None found | Remove export; no shim |
| `database` `./interfaces` → `./ports` | None found | Rename folder + export |
| `queue` `./types` → `./ports` | None found | Rename folder + export |
| `queue` `./validation` stays | None found | Folder rename only (`utils/` → `validation/`) |
| `cron` `./types` → `./ports` | None found | Rename folder + export |
| `kv` internal folder rename | None (internal only) | `bridges/` → `adapters/`, `core/` → `application/` |

### Constants / enums

| Unit | Constant | Values |
|------|----------|--------|
| logger | `LOG_LEVELS` | `['debug', 'info', 'warn', 'error']` |
| kv | `KV_PROVIDER` | `'deno-kv'`, `'redis'`, `'kvdex'`, `'memory'` |
| database | `DATABASE_PROVIDER` | `'postgres'`, `'mssql'`, `'mysql'` |
| queue | `QUEUE_PROVIDER` | `'deno-kv'`, `'redis'`, `'amqp'`, `'kv-polling'` |
| cron | `CRON_PROVIDER` | `'deno'`, `'memory'` |

### Commit slices summary

- Sub-wave 2a: 10 slices (logger docs/tasks, telemetry doc-lint + docs parity, aspire schema doc-lint + drop helpers)
- Sub-wave 2b: 23 slices (kv folder vocab + docs + testing, database from-scratch + rename + doc-lint, prisma-adapter-mysql README + docs + doc-lint + skipLibCheck removal)
- Sub-wave 2c: 17 slices (queue rename + doc-lint + testing + defensive I/O, cron rename + doc-lint + testing + defensive I/O, consumer gates, e2e:cli)

### Contributor path

To add a new adapter to an A2 unit:

1. Define the port contract in `ports/<name>.ts` (or `types/` for domain types).
2. Implement the adapter in `adapters/<technology>.adapter.ts`.
3. Export from `adapters/mod.ts`.
4. Add a subpath export in `deno.json` (`./adapters/<technology>`).
5. Add an in-memory variant in `src/testing/<technology>-memory.ts`.
6. Add a factory case in `application/create-<unit>.ts` (composition root).
7. Add defensive I/O tests in `tests/<technology>-adapter_test.ts`.
8. Add a runnable docs example in `tests/_fixtures/docs-examples_test.ts`.
9. Run `deno publish --dry-run --allow-dirty` and `deno doc --lint`.

### Deferred scope (Design)

- Real backend integration tests (Redis, Postgres, AMQP, MySQL) — need Docker/CI.
- `telemetry` instrumentation extraction to plugin packages.
- `kv` `bridge_test.ts` god-file split (AP-1 debt).
- Deep Prisma type wrappers for `database` and `prisma-adapter-mysql` doc-lint (may become debt).
