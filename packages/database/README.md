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
