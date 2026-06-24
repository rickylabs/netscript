# @netscript/prisma-adapter-mysql

[![JSR](https://jsr.io/badges/@netscript/prisma-adapter-mysql)](https://jsr.io/@netscript/prisma-adapter-mysql)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A Prisma driver adapter that connects Prisma Client to MySQL and MariaDB through Deno's native
MySQL driver, so NetScript's data layer runs on Deno without the Node socket internals that break
`@prisma/adapter-mariadb`.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/prisma-adapter-mysql

# Node.js / Bun
npx jsr add @netscript/prisma-adapter-mysql
bunx jsr add @netscript/prisma-adapter-mysql
```

### Usage

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';

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

---

## 📦 Key Capabilities

- **Deno-native driver**: Wraps the Deno MySQL client instead of the npm `mariadb` package, avoiding
  the `Symbol(Deno.internal.rid)` failure that `@prisma/adapter-mariadb` hits under Deno's Node
  compatibility layer.
- **MySQL and MariaDB**: One `PrismaMySql` factory serves both engines; `inferCapabilities` reads
  the server version to report whether relation joins are supported.
- **Pooled connections**: A connection config with `poolSize` opens a pool when Prisma connects, and
  `connect()` returns a `PrismaMySqlConnectedAdapter` that exposes `queryRaw`, `executeRaw`,
  transactions, and `dispose`.
- **Typed surface**: Configuration, query, result, and isolation-level types
  (`MySqlConnectionConfig`, `PrismaMySqlQuery`, `PrismaMySqlResultSet`, `PrismaMySqlIsolationLevel`)
  are exported from the package root.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/prisma-adapter-mysql/](https://rickylabs.github.io/netscript/reference/prisma-adapter-mysql/)
- **Data & Persistence**:
  [rickylabs.github.io/netscript/data-persistence/](https://rickylabs.github.io/netscript/data-persistence/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
