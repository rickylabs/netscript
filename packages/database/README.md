# @netscript/database

[![JSR](https://jsr.io/badges/@netscript/database)](https://jsr.io/@netscript/database)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The database integration layer for NetScript: a provider-agnostic adapter contract plus Prisma v7
driver adapters for PostgreSQL, SQL Server, and MySQL, with connection-string helpers, JSON
extensions, OpenTelemetry tracing, and a shared contract test harness.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/database

# Node.js / Bun
npx jsr add @netscript/database
bunx jsr add @netscript/database
```

### Usage

```typescript
import { createPostgresAdapter } from '@netscript/database/adapters/postgres';
import { PrismaClient } from './generated/client/mod.ts';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});

const prisma = new PrismaClient({ adapter: adapter.getDriverAdapter() });
adapter.setClient(prisma);

await adapter.connect();
const healthy = await adapter.healthCheck();
await adapter.disconnect();
```

Backend adapters live behind focused sub-path exports so a Postgres-only consumer never pulls in the
SQL Server or MySQL drivers. The package owns the reusable integration layer only; the user data
model stays in the application or plugin that owns it.

---

## 📦 Key Capabilities

- **Provider-agnostic contract**: `DatabaseAdapter` and `DatabaseAdapterFactory` define one connect
  / disconnect / health-check / raw-query interface across `postgres`, `mssql`, `mysql`, and
  `sqlite`.
- **Prisma v7 driver adapters**: `createPostgresAdapter`, plus `@netscript/database/adapters/mssql`
  and `@netscript/database/adapters/mysql`, wrap the official Prisma driver adapters and expose them
  through `getDriverAdapter()`.
- **Connection-string helpers**: `buildPostgresConnectionString`, `buildMssqlConnectionString`, and
  `parseConnectionString` assemble and parse provider URLs from typed parts.
- **JSON extensions and tracing**: `registerJsonFields` / `jsonUtils` handle JSON serialization
  across SQL backends, and `enableInstrumentation` toggles Prisma OpenTelemetry spans when
  `OTEL_DENO=true`.
- **Contract test harness**: `runDatabaseAdapterContract` and `createMockDatabaseAdapter` from
  `@netscript/database/testing` prove a custom adapter against the first-party port contract.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/database/](https://rickylabs.github.io/netscript/reference/database/)
- **Data & Persistence**:
  [rickylabs.github.io/netscript/data-persistence/](https://rickylabs.github.io/netscript/data-persistence/)
- **How-to: Database and migration**:
  [rickylabs.github.io/netscript/how-to/database-migration/](https://rickylabs.github.io/netscript/how-to/database-migration/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
