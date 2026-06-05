# @netscript/prisma-adapter-mysql

A Prisma driver adapter for MySQL/MariaDB that uses Deno's native mysql driver instead of the npm `mariadb` package.

## Problem

Prisma v7 introduced driver adapters allowing custom database drivers. The official `@prisma/adapter-mariadb` uses the npm `mariadb` package, which has a critical incompatibility with Deno:

```
Error: Symbol(Deno.internal.rid)
```

The mariadb driver accesses internal Node.js socket properties that don't exist in Deno's Node compatibility layer.

## Solution

This adapter uses `deno.land/x/mysql` (deno_mysql) instead of the npm mariadb package, providing native Deno compatibility without requiring any Node.js dependencies.

## Installation

Since this is a Deno package, you can import it directly:

```typescript
import { PrismaMySql } from "jsr:@netscript/prisma-adapter-mysql";
// or from your local packages
import { PrismaMySql } from "../packages/prisma-adapter-mysql/src/mod.ts";
```

## Usage

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaMySql } from "@netscript/prisma-adapter-mysql";

// Create adapter with connection config
const adapter = new PrismaMySql({
  hostname: "localhost",
  port: 3306,
  username: "root",
  password: "password",
  db: "mydb",
  poolSize: 5,
});

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

// Use Prisma normally
const users = await prisma.user.findMany();

// Cleanup
await prisma.$disconnect();
```

## Configuration Options

```typescript
interface MySqlConnectionConfig {
  /** MySQL server hostname */
  hostname?: string;
  /** MySQL server port (default: 3306) */
  port?: number;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Database name */
  db?: string;
  /** Connection pool size (default: 1) */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** TLS configuration */
  tls?: {
    mode?: "disabled" | "verify_identity";
    caCerts?: string[];
  };
}

interface PrismaMySqlOptions {
  /** Database schema name */
  database?: string;
  /** Callback when connection errors occur */
  onConnectionError?: (err: Error) => void;
}
```

## Features

- ✅ Native Deno support - no Node.js compatibility layer issues
- ✅ Full Prisma CRUD operations (findMany, create, update, delete)
- ✅ Transaction support with isolation levels
- ✅ Connection pooling
- ✅ Automatic MySQL/MariaDB capability detection
- ✅ Proper type mappings (BigInt, Date, JSON, Bytes, etc.)
- ✅ Comprehensive error handling with Prisma error types

## Compatibility

- MySQL 5.7+
- MySQL 8.0+ (with relation joins support)
- MariaDB 10.2+
- Deno 1.x / 2.x
- Prisma 7.0+

## Limitations

- Some advanced features may have different behavior compared to the official adapter
- Field metadata inference is based on JavaScript types when full metadata isn't available

## Development

```bash
# Type check
deno task check

# Run tests (requires MySQL server)
deno task test
```

## License

Apache-2.0 (same as Prisma)
