---
layout: layouts/base.vto
title: "@netscript/prisma-adapter-mysql"
---

# `@netscript/prisma-adapter-mysql`

Prisma driver adapter for MySQL and MariaDB on Deno. Rather than using Deno-native TCP sockets directly, this adapter dynamically imports the npm `mysql2/promise` driver to handle connection pooling, query execution, and Node.js-compatible socket streams.

For the full index of packages and plugins return to the [reference overview](/reference/).

## Runtime and Deployment Constraints

- **Dependency**: Dynamically imports `mysql2/promise` from npm at runtime.
- **Node Compatibility**: Fully compatible with Deno's Node.js compatibility layer and npm package resolution.
- **Pooling Ownership**: The constructed `PrismaMySqlConnectedAdapter` owns the underlying `mysql2` connection pool. Call `dispose()` to close the pool and release resources deterministically.
- **Timeout**: The `timeout` configuration option controls connection establishment timeouts (mapped to `connectTimeout` in `mysql2`).
- **Connection Strings**: Not parsed directly by the factory; use individual connection configuration fields.

## Usage Example

> [!NOTE]
> Connection error hooks (such as `onConnectionError`) are not supported by the shipped adapter and are blocked on #1293.

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaMySql } from "@netscript/prisma-adapter-mysql";

// 1. Connection configuration
const config = {
  hostname: "localhost",
  port: 3306,
  username: "root",
  password: "password",
  db: "mydb",
  poolSize: 5,
  timeout: 10000,
};

// 2. Construct the adapter factory with options
const adapterFactory = new PrismaMySql(config, {
  database: "mydb",
});

// 3. Connect to database and construct Prisma Client
const adapter = await adapterFactory.connect();
const prisma = new PrismaClient({ adapter });

try {
  // 4. Run a query
  const result = await prisma.$queryRawUnsafe("SELECT 1 + 1");
  console.log("Query Result:", result);
} finally {
  // 5. Deterministically disconnect Prisma and close the connection pool
  await prisma.$disconnect();
  await adapter.dispose();
}
```

The package exposes a single root entrypoint (`@netscript/prisma-adapter-mysql` → `./mod.ts`).
`PrismaMySql` is the factory you construct with a connection configuration; `connect()`
returns a [`PrismaMySqlConnectedAdapter`](#connected-adapter) that you pass to a Prisma client.

## Adapter factory

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `PrismaMySql` | class | `new PrismaMySql(config: MySqlConnectionConfig, options?: PrismaMySqlOptions)` | Factory for creating Prisma MySQL adapter instances. Exposes `provider: "mysql"`, `adapterName: string`, and `connect(): Promise<PrismaMySqlConnectedAdapter>`. |
| `PrismaMySqlAdapterFactory` | reference | `PrismaMySqlAdapterFactory` | Re-export alias of `PrismaMySql`. |
| `inferCapabilities` | function | `function inferCapabilities(version: unknown): MySqlCapabilities` | Infer server capabilities from a version string. |

## Connected adapter

<a id="connected-adapter"></a>

| Symbol | Kind | Description |
| --- | --- | --- |
| `PrismaMySqlConnectedAdapter` | interface | Connected MySQL adapter returned by `PrismaMySql.connect()`. Provides `queryRaw`, `executeRaw`, `executeScript`, `getConnectionInfo`, `startTransaction`, `dispose`, and `underlyingDriver`. |
| `PrismaMySqlTransactionAdapter` | interface | Connected transaction adapter returned by `startTransaction`. Provides `queryRaw`, `executeRaw`, `commit`, and `rollback`. |
| `PrismaMySqlConnectionInfo` | interface | Connection details reported to Prisma (`schemaName?`, `supportsRelationJoins`). |

## Query and result types

| Symbol | Kind | Description |
| --- | --- | --- |
| `PrismaMySqlQuery` | interface | A Prisma query: `sql: string`, `args: unknown[]`, and `argTypes` metadata for each argument. |
| `PrismaMySqlResultSet` | interface | Result set from raw queries: `columnNames`, `columnTypes`, `rows`, and optional `lastInsertId`. |
| `PrismaMySqlIsolationLevel` | type alias | `"READ UNCOMMITTED" \| "READ COMMITTED" \| "REPEATABLE READ" \| "SNAPSHOT" \| "SERIALIZABLE"` — isolation levels accepted by the adapter. |

## Configuration types

| Symbol | Kind | Description |
| --- | --- | --- |
| `MySqlConnectionConfig` | interface | MySQL connection configuration: `hostname?`, `port?`, `username?`, `password?`, `db?`, `poolSize?`, `timeout?`, and `tls?`. |
| `PrismaMySqlOptions` | interface | Adapter options: `database?` (schema name). |
| `MySqlCapabilities` | interface | Capabilities of the connected MySQL server (`supportsRelationJoins`). |

## Driver interfaces

These describe the underlying `deno_mysql` client surface the adapter wraps.

| Symbol | Kind | Description |
| --- | --- | --- |
| `DenoMySqlClient` | interface | `deno_mysql` client: `connect`, `query`, `execute`, `transaction`, `useConnection`, and `close`. |
| `DenoMySqlConnection` | interface | Connection used inside transactions: `query` and `execute`. |
| `ExecuteResult` | interface | Result from an `execute()` call for INSERT/UPDATE/DELETE: `affectedRows?` and `lastInsertId?`. |

---

Back to the [reference overview](/reference/).
