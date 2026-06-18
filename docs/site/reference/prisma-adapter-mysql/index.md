---
layout: layouts/base.vto
title: "@netscript/prisma-adapter-mysql"
---

# `@netscript/prisma-adapter-mysql`

Prisma driver adapter for MySQL and MariaDB on Deno. This page is generated from the
package's public surface with `deno doc` (US-2). For the full index of packages and plugins
return to the [reference overview](/reference/).

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
| `PrismaMySqlOptions` | interface | Adapter options: `database?` (schema name) and `onConnectionError?` callback. |
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
