---
package: '@netscript/prisma-adapter-mysql'
title: 'TLS'
---

# TLS

Use TLS certificate material when connecting to managed MySQL services:

```typescript
const adapter = new PrismaMySql({
  hostname: 'mysql.example.net',
  username: 'app',
  password: Deno.env.get('MYSQL_PASSWORD'),
  db: 'app',
  tls: {
    mode: 'verify_identity',
    caCerts: [await Deno.readTextFile('ca.pem')],
  },
});
```

The application needs the permissions it uses to read secrets and files:

```powershell
deno run --allow-net --allow-env=MYSQL_PASSWORD --allow-read=ca.pem app.ts
```
