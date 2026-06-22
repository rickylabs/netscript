# @netscript/prisma-adapter-mysql

Prisma v7 driver adapter for MySQL and MariaDB on Deno, backed by `mysql2`.

## Install

```sh
deno add jsr:@netscript/prisma-adapter-mysql
```

## Quick example

Create the adapter factory from a MySQL connection config and pass it to Prisma Client:

```ts
import { PrismaClient } from '@prisma/client';
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';

const adapter = new PrismaMySql({
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
  poolSize: 5,
});

const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany();

await prisma.$disconnect();
```

The factory opens pooled MySQL connections when Prisma connects, detects server
capabilities, and maps MySQL driver errors to Prisma error kinds. Public types
(`MySqlConnectionConfig`, `PrismaMySqlOptions`, `PrismaMySqlConnectedAdapter`) are
exported from the package root.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/prisma-adapter-mysql/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
