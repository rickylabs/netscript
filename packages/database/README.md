# @netscript/database

[![JSR](https://jsr.io/badges/@netscript/database)](https://jsr.io/@netscript/database)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The database integration layer for NetScript: one provider-agnostic adapter contract plus Prisma
v7 driver adapters for PostgreSQL, SQL Server, and MySQL, with connection-string helpers, JSON
extensions, and OpenTelemetry tracing.**

Running Prisma on Deno means picking a driver adapter per backend, wiring its lifecycle, and
re-solving the same JSON-serialization and tracing questions in every service. `@netscript/database`
answers them once: a `DatabaseAdapter` contract that every backend implements identically, factories
that wrap the official Prisma v7 driver adapters, and helpers for the plumbing around them —
building and parsing connection strings, serializing JSON fields across SQL backends, and emitting
Prisma OpenTelemetry spans.

The package owns the reusable integration layer only. Your data model, migrations, and generated
Prisma client stay in the application or plugin that owns them — the adapter takes the client you
built and manages connect, health, and disconnect around it.

## Why teams use it

- **One contract, four providers** — `DatabaseAdapter` and `DatabaseAdapterFactory` define a single
  connect / disconnect / health-check / raw-query interface across `postgres`, `mssql`, `mysql`, and
  `sqlite`, so call sites never branch on the backend.
- **Prisma v7 driver adapters included** — `createPostgresAdapter` at
  `@netscript/database/adapters/postgres`, with SQL Server and MySQL siblings behind their own
  sub-paths, wrap the official Prisma driver adapters and hand them to Prisma Client via
  `getDriverAdapter()`.
- **Focused sub-path exports** — a Postgres-only consumer never pulls the SQL Server or MySQL
  drivers into its module graph; each backend lives behind its own export.
- **Connection-string helpers** — `buildPostgresConnectionString`, `buildMssqlConnectionString`, and
  `parseConnectionString` assemble and parse provider URLs from typed parts instead of string
  concatenation.
- **JSON fields and tracing solved once** — `registerJsonFields` / `jsonUtils` handle JSON
  serialization uniformly across SQL backends, and `enableInstrumentation` turns on Prisma
  OpenTelemetry spans when `OTEL_DENO=true`.
- **Contract tests included** — `runDatabaseAdapterContract` and `createMockDatabaseAdapter` from
  `@netscript/database/testing` prove a custom adapter against the same contract the first-party
  adapters pass.

## Install

```bash
deno add jsr:@netscript/database@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Prerequisites: a running PostgreSQL server and a generated Prisma client for your schema — the
adapter wraps the client you supply; it does not generate one.

```typescript
import { createPostgresAdapter } from '@netscript/database/adapters/postgres';

// In your app this is the generated client:
//   import { PrismaClient } from './generated/client/mod.ts';
declare const PrismaClient: new (options: { adapter: unknown }) => {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRaw: unknown;
  $queryRawUnsafe: unknown;
  $executeRaw: unknown;
  $executeRawUnsafe: unknown;
};

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});

const prisma = new PrismaClient({ adapter: adapter.getDriverAdapter() });
adapter.setClient(prisma);

await adapter.connect();
const healthy = await adapter.healthCheck();
await adapter.disconnect();
```

In a scaffolded NetScript project, `netscript db init` generates this wiring for you — the manual
form above is for custom hosts and tests.

## Public surface

| Entry                 | What it gives you                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `.`                   | The `DatabaseAdapter` contract, `createPostgresAdapter`, connection-string helpers, `jsonUtils` |
| `./ports`             | Contract types only (`DatabaseAdapter`, `DatabaseAdapterFactory`, provider and status types)    |
| `./adapters/postgres` | `PostgresAdapter` over the official Prisma pg driver adapter                                    |
| `./adapters/mssql`    | SQL Server adapter over the official Prisma mssql driver adapter                                |
| `./adapters/mysql`    | MySQL/MariaDB adapter over `@netscript/prisma-adapter-mysql`                                    |
| `./extensions`        | JSON field registry and serialization utilities                                                 |
| `./tracing`           | `enableInstrumentation` for Prisma OpenTelemetry spans                                          |
| `./testing`           | `runDatabaseAdapterContract`, `createMockDatabaseAdapter`                                       |

The always-current symbol list is
[`deno doc jsr:@netscript/database@<version>`](https://jsr.io/@netscript/database/doc) (pin
`<version>` on the pre-release line, as above).

## Docs

- **Reference — adapters, helpers, and exports**:
  [rickylabs.github.io/netscript/reference/database/](https://rickylabs.github.io/netscript/reference/database/)
- **Data & Persistence — how the data layer fits together**:
  [rickylabs.github.io/netscript/data-persistence/](https://rickylabs.github.io/netscript/data-persistence/)
- **How-to: database and migration workflow**:
  [rickylabs.github.io/netscript/how-to/database-migration/](https://rickylabs.github.io/netscript/how-to/database-migration/)
- **API docs on JSR**: [jsr.io/@netscript/database/doc](https://jsr.io/@netscript/database/doc)

## Compatibility

Designed for Deno with Prisma v7 driver adapters; database connections need `--allow-net` (plus
`--allow-env` for environment-based configuration). Tracing activates only when `OTEL_DENO=true`.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.

## Command persistence contracts

`@netscript/database/commands` owns `CommandStorePort<TTx>` and `CommandTransaction<TTx>`,
capability declarations, transaction requests and logical receipt/audit/outbox rows. A provider
constructs all delegates from the actual transaction callback. Root lifecycle and nested transaction
methods stay outside the business handle. The boundary invokes work once; a busy claim requires
rollback before an error surfaces. A capability declaration validates and freezes metadata; it
cannot certify an adapter's physical guarantees. This contract subpath requires no permissions.

`CommandStoreError` and `CommandStoreFailure` provide database-owned bounded provider failure
classification. Adapters classify acquisition, driver and boundary failures themselves; driver
codes/messages stay solely in the trusted cause. The service translates this class and preserves
arbitrary callback business errors. `busy` remains a terminal receipt-claim result requiring
rollback, rather than a retry of the transaction callback.

### True callback client and schema ownership

`withTransaction(root, work)` preserves a separate callback type through `TransactionClientPort<TTx>`. Bind Prisma through its actual callback; never assert a root client into the business handle. Consumers generate `CommandTransactionClient = Omit<Prisma.TransactionClient, '$transaction' | '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>`.

The reviewed schema, migration and bridge samples in `tests/fixtures/command-store/` show the consumer-owned receipt unique key, completion check, audit fields and initial outbox lease fields. Generate a Prisma client and bind the callback explicitly. Apply the migration through the application's normal review workflow. CLI generation is deferred to RFC 0003 stage 8; importing the framework never creates tables or runs a migration.

### PostgreSQL command store

Import `createPostgresCommandStore` from `@netscript/database/commands/postgres`, pass the consumer's generated callback bridge, and configure `transactionTimeoutMs`. The store supports PostgreSQL ReadCommitted, ReadUncommitted (PostgreSQL treats it as ReadCommitted), RepeatableRead and Serializable. Receipt wait is an integer from 1 to 60,000 milliseconds; zero would disable PostgreSQL lock_timeout and is refused. The timeout is finite and cancellation is cooperative.

Claims use the reviewed unique key with `INSERT ... ON CONFLICT DO NOTHING RETURNING`, then one indexed winner select. Successful claims restore the previous transaction-local lock timeout. A lock timeout produces terminal busy, rolls back the complete callback, and forbids subsequent side-record calls. Serialization/deadlock errors are retryable provider failures; the callback is never retried automatically. Each owned receipt must complete before commit. All audit/outbox SQL derives from the callback client; root business/lifecycle operations are refused.

Prisma currently exposes nested transactions on its callback proxy. The consumer bridge sample hides root operations at runtime as well as in the generated alias. It preserves model delegates and uses the actual provider transaction for every side record. Table mappings match the reviewed sample migration; explicit mapping changes require a reviewed adapter/bridge migration.

`bash .llm/tools/command-postgres-conformance.sh` runs the native generated-client provider gate with an isolated temporary Unix socket. The dedicated CI workflow uses Deno 2.9.5. A suite skipped without provider configuration never certifies PostgreSQL support. No database credentials, connection addresses or operational evidence belong in the public run artifacts.
