---
title: Getting Started
description: First run guide for database adapters and contract tests.
package: '@netscript/database'
order: 3
---

# Getting Started

Install the package:

```powershell
deno add jsr:@netscript/database@^0.0.1-alpha.0
```

Create an adapter:

```ts
import { createPostgresAdapter } from 'jsr:@netscript/database@^0.0.1-alpha.0/adapters/postgres';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});
```

Run a contract test:

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

Grant network access when connecting to a real database.
