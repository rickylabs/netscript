# @netscript/prisma-adapter-mysql

[![JSR](https://jsr.io/badges/@netscript/prisma-adapter-mysql)](https://jsr.io/@netscript/prisma-adapter-mysql)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A Prisma driver adapter that connects Prisma Client to MySQL and MariaDB through Deno's native
MySQL driver — no Node socket internals, no `@prisma/adapter-mariadb` breakage under Deno.**

Prisma's official MariaDB adapter rides on the npm `mariadb` package, which reaches into Node socket
internals that Deno's compatibility layer does not provide — the run dies on
`Symbol(Deno.internal.rid)` before the first query. `@netscript/prisma-adapter-mysql` replaces that
foundation: one `PrismaMySql` factory wraps the Deno-native MySQL client, opens a connection pool
when Prisma connects, and serves MySQL and MariaDB through the standard Prisma v7 driver-adapter
interface. It is the engine behind `@netscript/database`'s MySQL support and works standalone with
any Prisma Client on Deno.

## Why teams use it

- **Deno-native driver** — wraps the Deno MySQL client instead of the npm `mariadb` package,
  avoiding the `Symbol(Deno.internal.rid)` failure that `@prisma/adapter-mariadb` hits under Deno's
  Node compatibility layer.
- **MySQL and MariaDB from one factory** — `PrismaMySql` serves both engines; `inferCapabilities`
  reads the server version to report whether relation joins are supported.
- **Pooled connections** — a connection config with `poolSize` opens a pool when Prisma connects,
  and `connect()` returns a `PrismaMySqlConnectedAdapter` exposing `queryRaw`, `executeRaw`,
  transactions, and `dispose`.
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

Prerequisites: a running MySQL or MariaDB server and a generated Prisma client for your schema.

```typescript
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';

// In your app this is the generated client:
//   import { PrismaClient } from './generated/client/mod.ts';
declare const PrismaClient: new (options: { adapter: PrismaMySql }) => {
  user: { findMany(): Promise<unknown[]> };
  $disconnect(): Promise<void>;
};

// Construct the adapter factory from a MySQL/MariaDB connection config.
const adapter = new PrismaMySql({
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
  poolSize: 5,
});

// Hand the adapter to Prisma Client; the pool opens on connect.
const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany();

await prisma.$disconnect();
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

Designed for Deno with Prisma v7 driver adapters enabled; database connections need `--allow-net`.
Works against MySQL 8.x and MariaDB servers.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
