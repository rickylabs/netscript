# @netscript/prisma-adapter-mysql

[![JSR](https://jsr.io/badges/@netscript/prisma-adapter-mysql)](https://jsr.io/@netscript/prisma-adapter-mysql)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A Prisma 7 driver adapter that connects Prisma Client to MySQL and MariaDB through the dynamically
imported npm `mysql2/promise` driver.**

Prisma's official MariaDB adapter rides on the npm `mariadb` package, which reaches into Node socket
internals that Deno's compatibility layer does not provide — the run dies on
`Symbol(Deno.internal.rid)` before the first query. `@netscript/prisma-adapter-mysql` uses mysql2
instead: one `PrismaMySql` factory dynamically loads `mysql2/promise`, opens a connection pool when
Prisma connects, and serves MySQL and MariaDB through the Prisma 7 driver-adapter interface. The
deployment must provide Deno npm resolution, Node-compatible socket APIs, and network access. It is
the engine behind `@netscript/database`'s MySQL support.

## Why teams use it

- **mysql2 driver** — dynamically imports npm `mysql2/promise` instead of npm `mariadb`, avoiding
  the `Symbol(Deno.internal.rid)` failure while still relying on Deno's npm and Node-compat layers.
- **MySQL and MariaDB from one factory** — `PrismaMySql` serves both engines; `inferCapabilities`
  reads the server version to report whether relation joins are supported.
- **Pooled connections** — Prisma receives the factory and owns the connected pool through
  `$disconnect()`. A caller that invokes `connect()` directly owns the returned
  `PrismaMySqlConnectedAdapter` and must call `dispose()`.
- **Fully typed surface** — configuration, query, result, and isolation-level types
  (`MySqlConnectionConfig`, `PrismaMySqlQuery`, `PrismaMySqlResultSet`, `PrismaMySqlIsolationLevel`)
  are exported from the package root.

## Install

```bash
deno add jsr:@netscript/prisma-adapter-mysql@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Prerequisites: a running MySQL or MariaDB server and a generated Prisma 7 client for your schema.
The generated client also needs `@prisma/client` resolvable through your Deno import map or an
`npm:` specifier; the workspace catalog alone is not an import map.

```typescript
import { PrismaClient } from './schema/.generated/client.server.ts';
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';

// Construct the adapter factory from a MySQL/MariaDB connection config.
const adapter = new PrismaMySql({
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
  poolSize: 5,
  timeout: 10_000,
}, {
  onConnectionError(error) {
    console.error('MySQL connection error:', error);
  },
});

// Hand the adapter to Prisma Client; the pool opens on connect.
const prisma = new PrismaClient({ adapter });

try {
  const result = await prisma.$queryRawUnsafe('SELECT 1');
  console.log(result);
} finally {
  await prisma.$disconnect();
}
```

## Public surface

| Symbol                                        | What it gives you                                 |
| --------------------------------------------- | ------------------------------------------------- |
| `PrismaMySql`                                 | The driver-adapter factory Prisma Client consumes |
| `PrismaMySqlConnectedAdapter`                 | The connected adapter: raw queries, transactions  |
| `inferCapabilities`                           | Server-version capability probe (relation joins)  |
| `MySqlConnectionConfig`, `PrismaMySqlOptions` | Connection and adapter configuration types        |
| `PrismaMySqlQuery`, `PrismaMySqlResultSet`    | Query and result-set shapes                       |
| `PrismaMySqlIsolationLevel`                   | Supported transaction isolation levels            |

The always-current symbol list is
[`deno doc jsr:@netscript/prisma-adapter-mysql@<version>`](https://jsr.io/@netscript/prisma-adapter-mysql/doc)
(pin `<version>` on the pre-release line, as above).

## Docs

- **Reference — adapter options and exports**:
  [rickylabs.github.io/netscript/reference/prisma-adapter-mysql/](https://rickylabs.github.io/netscript/reference/prisma-adapter-mysql/)
- **Data & Persistence — the NetScript data layer around it**:
  [rickylabs.github.io/netscript/data-persistence/](https://rickylabs.github.io/netscript/data-persistence/)
- **API docs on JSR**:
  [jsr.io/@netscript/prisma-adapter-mysql/doc](https://jsr.io/@netscript/prisma-adapter-mysql/doc)

## Compatibility

This package is a temporary Prisma 7 integration boundary ahead of the Prisma 8 / Prisma-next
database-layer rewrite. It dynamically imports npm `mysql2/promise`, so Deno deployments need npm
resolution, Node-compatible socket APIs, and `--allow-net`. The low-level factory accepts only the
structured `MySqlConnectionConfig` fields; it does not parse connection strings.

`poolSize` maps to mysql2 `connectionLimit` and defaults to 1. `timeout` maps only to the initial
mysql2 `connectTimeout`; it is not a query, transaction, queue, idle, or total-operation timeout.

`tls.mode: 'verify_identity'` is deprecated and retains its legacy behavior. Without non-empty
`caCerts`, mysql2 `ssl` is left unset, so the connection is plaintext and no TLS is requested. With
non-empty `caCerts`, only their newline-joined value is forwarded as `ssl.ca`; mysql2 hostname
identity verification is not enabled. Changing or removing this behavior requires a separately
scoped breaking change.

Works against MySQL 8.x and MariaDB servers.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
