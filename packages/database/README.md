# @netscript/database

Database adapter contracts, Prisma driver helpers, tracing, and schema tooling for NetScript.

[![JSR](https://jsr.io/badges/@netscript/database)](https://jsr.io/@netscript/database)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@netscript/database` is the database integration package for NetScript applications and plugins. It
publishes the adapter contracts that database backends implement, plus focused helpers for Prisma
driver adapters, tracing, schema generation, and SQL JSON handling.

The package does not own a user schema. User schemas stay in the application or plugin that owns the
data model. This package owns the reusable integration layer that lets those applications wire
PostgreSQL, SQL Server, MySQL, and future backends without copying connection and tracing code.

Use this package when a NetScript component needs a database port, a Prisma driver adapter factory,
or a shared contract test for an adapter. Do not use it as a global singleton; the caller reads
configuration, chooses the backend, and passes typed options to the adapter or Prisma client.

## Quickstart

Install the package:

```powershell
deno add jsr:@netscript/database@^0.0.1-alpha.0
```

Create a PostgreSQL adapter:

```ts
import { createPostgresAdapter } from 'jsr:@netscript/database@^0.0.1-alpha.0/adapters/postgres';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});
```

Use the adapter with a generated Prisma client:

```ts
import { PrismaClient } from './generated/client/mod.ts';

const prisma = new PrismaClient({
  adapter: adapter.getDriverAdapter(),
});

await prisma.$connect();
await prisma.$disconnect();
```

## Mental Model

```text
application config
  |
  v
database adapter options
  |
  +-- ports/             DatabaseAdapter contract
  +-- adapters/          postgres, mssql, mysql adapter factories
  +-- extensions/        SQL JSON serialization extension
  +-- tracing            Prisma tracing helpers
  +-- testing            adapter contract runner
```

`ports/` defines the behavior NetScript needs from a database adapter. The contract is small:
connect, disconnect, health check, status, client access, and raw execution for migration or
diagnostic flows.

`adapters/` contains technology-specific implementations. Each adapter is named after the backend it
wraps and implements the same port contract.

`testing/` provides the shared contract runner. Downstream packages use it to prove their custom
adapter behaves like the first-party implementations.

## API At A Glance

| Entrypoint                              | Use                                                                 |
| --------------------------------------- | ------------------------------------------------------------------- |
| `@netscript/database`                   | Root helper exports, connection string utilities, and common types. |
| `@netscript/database/ports`             | `DatabaseAdapter`, provider, connection, and transaction contracts. |
| `@netscript/database/adapters`          | Common adapter factory exports.                                     |
| `@netscript/database/adapters/postgres` | PostgreSQL Prisma driver adapter factory.                           |
| `@netscript/database/adapters/mssql`    | SQL Server Prisma driver adapter factory.                           |
| `@netscript/database/adapters/mysql`    | MySQL adapter factory surface.                                      |
| `@netscript/database/extensions`        | SQL JSON Prisma extension.                                          |
| `@netscript/database/scripts`           | Schema and migration helper entrypoints.                            |
| `@netscript/database/tracing`           | Prisma tracing helpers.                                             |
| `@netscript/database/testing`           | Mock adapter and reusable contract tests.                           |

See [reference](./docs/reference/README.md) for the alpha entrypoint map.

## Common Recipes

### Create A PostgreSQL Adapter

```ts
import { createPostgresAdapter } from 'jsr:@netscript/database@^0.0.1-alpha.0/adapters/postgres';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});
```

### Create A SQL Server Adapter

```ts
import { createMssqlAdapter } from 'jsr:@netscript/database@^0.0.1-alpha.0/adapters/mssql';

const adapter = createMssqlAdapter({
  connectionString: 'sqlserver://localhost:1433;database=app;user=sa;password=secret',
});
```

### Build A Connection String

```ts
import { buildPostgresConnectionString } from 'jsr:@netscript/database@^0.0.1-alpha.0';

const url = buildPostgresConnectionString({
  host: 'localhost',
  port: 5432,
  database: 'app',
  user: 'app',
  password: 'secret',
});
```

### Run Adapter Contract Tests

```ts
import {
  createMockDatabaseAdapter,
  runDatabaseAdapterContract,
} from 'jsr:@netscript/database@^0.0.1-alpha.0/testing';

runDatabaseAdapterContract({
  name: 'mock',
  make: () => createMockDatabaseAdapter(),
});
```

### Use SQL JSON Serialization

```ts
import { sqlJsonExtension } from 'jsr:@netscript/database@^0.0.1-alpha.0/extensions';

const extension = sqlJsonExtension(Prisma, {
  databaseType: 'mssql',
  jsonFields: {
    SagaInstance: ['state'],
  },
});
```

## Configuration

| Option                  | Applies to         | Description                                                     |
| ----------------------- | ------------------ | --------------------------------------------------------------- |
| `connectionString`      | Adapters           | Full provider-specific database URL.                            |
| `host` / `port`         | Adapters           | Host and port when constructing provider URLs from parts.       |
| `database`              | Adapters           | Database or schema name.                                        |
| `username` / `password` | Adapters           | Credentials passed to the driver adapter.                       |
| `ssl`                   | Adapters           | Provider-specific SSL mode.                                     |
| `poolSize`              | Adapters           | Connection pool size when supported by the backend.             |
| `timeout`               | Adapters           | Connection timeout in milliseconds.                             |
| `jsonFields`            | SQL JSON extension | Map of Prisma model names to JSON string fields.                |
| `enableInstrumentation` | Shared config      | Whether Prisma tracing helpers should be enabled by the caller. |

Configuration is a typed boundary. Read environment variables in the application, validate them, and
pass typed options to the adapter.

## Testing

Use `@netscript/database/testing` for adapter contract tests:

```ts
import { runDatabaseAdapterContract } from 'jsr:@netscript/database@^0.0.1-alpha.0/testing';
import { createMyAdapter } from './my-adapter.ts';

runDatabaseAdapterContract({
  name: 'custom adapter',
  make: () => createMyAdapter(),
});
```

The package ships a mock adapter for unit tests that need a database port but do not need a real
database connection.

## Observability

Database adapters should expose provider, host, database, query kind, duration, and error fields to
the caller's logger or telemetry layer. This package provides Prisma tracing helpers through the
`./tracing` subpath but does not create global tracing state at module load time.

Recommended fields:

| Field        | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `provider`   | `postgres`, `mssql`, `mysql`, or `sqlite`.                              |
| `database`   | Logical database name.                                                  |
| `operation`  | `connect`, `disconnect`, `healthCheck`, `executeRaw`, or Prisma action. |
| `durationMs` | Operation duration in milliseconds.                                     |
| `error`      | Normalized error message when the operation fails.                      |

## Architecture

This is an Archetype 2 integration package. The port contract lives in `ports/`, backend
implementations live in `adapters/`, and tests consume the public `./testing` subpath.

Read [docs/architecture.md](./docs/architecture.md) for the layer map and anti-pattern notes.

## Stability And Versioning

This package is part of the `0.0.1-alpha.0` quality wave. During alpha, public subpaths can still be
renamed when doctrine requires it. The `./interfaces` subpath was removed in this wave and replaced
by `./ports` without a compatibility shim.

## Compatibility Matrix

| Runtime  | Status                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Deno 2.x | Supported target.                                                               |
| Node.js  | Supported through JSR/npm consumers when Prisma driver dependencies support it. |
| Browser  | Not supported; database drivers require server-side APIs.                       |

## Required Permissions

Adapter usage requires network access to the database endpoint. Script entrypoints may need file
read/write and process permissions when generating or patching Prisma artifacts. Pure ports and
types require no permissions.

## Contributing

Run package checks before opening a PR:

```powershell
deno task --cwd packages/database check
deno test --allow-all packages/database/tests/
deno publish --dry-run --allow-dirty
```

Keep new adapters small, named by technology, and covered by the contract runner from `./testing`.

## License

MIT.
