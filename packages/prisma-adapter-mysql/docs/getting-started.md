---
package: '@netscript/prisma-adapter-mysql'
title: 'Getting Started'
---

# Getting Started

Import the factory from the package root:

```typescript
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';
```

Create a factory with connection settings:

```typescript
const adapter = new PrismaMySql({
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
});
```

Pass it to Prisma Client:

```typescript
const prisma = new PrismaClient({ adapter });
```

Run with network permission:

```powershell
deno run --allow-net app.ts
```

Add environment or read permissions only when your application reads secrets or certificate files.
