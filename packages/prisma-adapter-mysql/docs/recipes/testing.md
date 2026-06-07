---
package: '@netscript/prisma-adapter-mysql'
title: 'Testing'
---

# Testing

The package test suite covers pure behavior that does not require a live database:

- capability detection
- MySQL field and value conversion
- driver error mapping

Run focused package tests:

```powershell
deno task test
```

Live MySQL behavior should be tested by application or runtime integration suites that can provision
a database.

Those suites should verify connection lifecycle, Prisma queries, transactions, and shutdown cleanup.
