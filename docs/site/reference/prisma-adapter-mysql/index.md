---
layout: layouts/base.vto
title: "@netscript/prisma-adapter-mysql"
---

# `@netscript/prisma-adapter-mysql`

Prisma driver adapter for MySQL and MariaDB on Deno. It dynamically imports the npm `mysql2/promise` driver to handle connection pooling, query execution, and Node.js-compatible socket streams.

For the full index of packages and plugins return to the [reference overview](/reference/).

## Runtime and Deployment Constraints

- **Dependency**: Dynamically imports `mysql2/promise` from npm at runtime.
- **Node Compatibility**: The deployment must provide Deno npm resolution and Node-compatible socket APIs; database access requires `--allow-net`.
- **Pooling Ownership**: Pass the `PrismaMySql` factory to Prisma. Prisma owns the connected `mysql2` pool and closes it through `$disconnect()`. Only callers that invoke `connect()` directly own the returned adapter and call `dispose()` themselves.
- **Timeout**: `timeout` maps only to mysql2 `connectTimeout`, the initial connection-establishment deadline. It is not a query, transaction, queue, idle, or total-operation timeout; mysql2 supplies its default when omitted.
- **Connection Strings**: This low-level factory accepts only the individual `MySqlConnectionConfig` fields. Higher-level NetScript database configuration may normalize other input forms separately.

## Usage Example

> [!NOTE]
> `onConnectionError` observes errors classified as connection failures: fatal handshake/transport errors, server-capacity errors 1040/1203, and the adapter's closed set of transport/pool codes. Authentication, access, and missing-database errors 1045/1044/1049 fire only when driver-fatal. Callback failure is contained and never replaces the primary error.

```typescript
import { PrismaClient } from "../../schema/.generated/client.server.ts";
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
  onConnectionError(error) {
    console.error("MySQL connection error:", error);
  },
});

// 3. Pass the factory to Prisma Client; Prisma opens the pool on connect.
const prisma = new PrismaClient({ adapter: adapterFactory });

try {
  // 4. Run a query
  const result = await prisma.$queryRawUnsafe("SELECT 1 + 1");
  console.log("Query Result:", result);
} finally {
  // 5. Deterministically disconnect Prisma and close its connection pool.
  await prisma.$disconnect();
}
```

The package exposes a single root entrypoint (`@netscript/prisma-adapter-mysql` → `./mod.ts`).
`PrismaMySql` is the factory you construct with a connection configuration and pass to Prisma.
Prisma calls `connect()` and owns the resulting [`PrismaMySqlConnectedAdapter`](#connected-adapter)
until `$disconnect()`. A direct `connect()` caller owns that result and must call `dispose()`.

## Exports

| Export | Path |
| --- | --- |
| `@netscript/prisma-adapter-mysql` | `./mod.ts` |

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
| `MySqlConnectionConfig` | interface | Structured MySQL connection configuration: `hostname?`, `port?`, `username?`, `password?`, `db?`, `poolSize?`, `timeout?`, and `tls?`. |
| `PrismaMySqlOptions` | interface | Adapter options: `database?` (reported schema name) and `onConnectionError?` (contained connection-failure observer). |
| `MySqlCapabilities` | interface | Capabilities of the connected MySQL server (`supportsRelationJoins`). |

### Legacy TLS mode

`tls.mode: "verify_identity"` is deprecated because its name does not match its unchanged legacy
behavior:

- Without non-empty `caCerts`, mysql2 `ssl` is left unset. The connection is plaintext and no TLS is requested.
- With non-empty `caCerts`, only their newline-joined value is forwarded as `ssl.ca`. mysql2 hostname identity verification is not enabled.

Changing this behavior or removing the mode requires a separately scoped breaking change.

---

Back to the [reference overview](/reference/).
