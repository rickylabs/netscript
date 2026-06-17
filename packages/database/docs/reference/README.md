---
title: Database Reference
description: Alpha entrypoint map for @netscript/database.
package: '@netscript/database'
order: 0
---

# Database Reference

Reference pages are generated from `deno doc` in a later wave. During alpha, use this entrypoint map
and JSR API docs.

| Entrypoint                              | Primary symbols                                                          |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `@netscript/database`                   | connection string helpers, transactions, tracing convenience exports.    |
| `@netscript/database/ports`             | `DatabaseAdapter`, `DatabaseProvider`, connection and transaction types. |
| `@netscript/database/adapters/postgres` | `PostgresAdapter`, `createPostgresAdapter`.                              |
| `@netscript/database/adapters/mssql`    | `MssqlAdapter`, `createMssqlAdapter`.                                    |
| `@netscript/database/adapters/mysql`    | `MysqlAdapter`, `createMysqlAdapter`.                                    |
| `@netscript/database/extensions`        | `sqlJsonExtension`, `registerJsonFields`, `jsonUtils`.                   |
| `@netscript/database/scripts`           | schema and migration helper functions.                                   |
| `@netscript/database/testing`           | `MockDatabaseAdapter`, `createMockDatabaseAdapter`, contract runner.     |
