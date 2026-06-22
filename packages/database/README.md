# @netscript/database

Database adapter contracts, Prisma driver helpers, tracing, and schema tooling for NetScript packages and plugins.

## Install

```sh
deno add jsr:@netscript/database
```

Backend adapters and helpers are available as focused subpath imports:

```ts
import { createPostgresAdapter } from '@netscript/database/adapters/postgres';
import { runDatabaseAdapterContract } from '@netscript/database/testing';
```

## Quick example

Create a PostgreSQL driver adapter and wire it into a generated Prisma client:

```ts
import { createPostgresAdapter } from '@netscript/database/adapters/postgres';
import { PrismaClient } from './generated/client/mod.ts';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});

const prisma = new PrismaClient({ adapter: adapter.getDriverAdapter() });

await prisma.$connect();
await prisma.$disconnect();
```

Build provider URLs from typed parts with `buildPostgresConnectionString()`, and prove custom
adapters against the first-party port contract with `runDatabaseAdapterContract()` from the
`@netscript/database/testing` subpath. The package owns the reusable integration layer only; the
user data model stays in the application or plugin that owns it.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/database/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
