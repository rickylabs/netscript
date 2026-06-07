---
package: '@netscript/prisma-adapter-mysql'
title: 'Local MySQL'
---

# Local MySQL

Use local connection settings during development:

```typescript
const adapter = new PrismaMySql({
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
  poolSize: 5,
});
```

Run the application with network permission:

```powershell
deno run --allow-net app.ts
```

The package does not start or provision MySQL.
