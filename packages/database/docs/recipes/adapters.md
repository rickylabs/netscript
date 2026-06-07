---
title: Database Adapters
description: Create provider-specific adapters for Prisma clients.
package: '@netscript/database'
order: 1
---

# Database Adapters

## Goal

Create the adapter that matches the database provider selected by the application.

```ts
import { createPostgresAdapter } from 'jsr:@netscript/database@^0.0.1-alpha.0/adapters/postgres';

const adapter = createPostgresAdapter({
  connectionString: 'postgresql://app:secret@localhost:5432/app',
});
```

## Pitfalls

Do not read environment variables inside reusable package code. Read and validate them in the
application composition root.
