# @netscript/prisma-adapter-mysql

`@netscript/prisma-adapter-mysql` is the MySQL and MariaDB Prisma driver adapter for NetScript
packages running on Deno.

It provides a Prisma v7 driver adapter factory backed by `mysql2`.

The package exists because the official MariaDB adapter depends on a driver path that can touch Node
socket internals that are not available in Deno.

The package is intentionally small.

It owns the Prisma adapter bridge, MySQL value conversion, capability detection, and driver error
mapping.

It does not own generated Prisma clients.

It does not create databases.

It does not manage application migrations.

Those concerns stay in consuming applications and plugins.

## Installation

Use the JSR package from Deno code:

```typescript
import { PrismaMySql } from 'jsr:@netscript/prisma-adapter-mysql';
```

Use the workspace package during local development:

```typescript
import { PrismaMySql } from '../packages/prisma-adapter-mysql/mod.ts';
```

The package targets `0.0.1-alpha.0` during the package-quality release line.

Keep this version lockstep with the rest of the NetScript alpha packages.

## Public Surface

The root export provides the adapter factory:

```typescript
import { PrismaMySql } from '@netscript/prisma-adapter-mysql';
```

The root export also exposes package-owned public types:

```typescript
import type {
  MySqlConnectionConfig,
  PrismaMySqlConnectedAdapter,
  PrismaMySqlOptions,
} from '@netscript/prisma-adapter-mysql';
```

Implementation helpers for conversion and error mapping are internal to the package.

They are tested directly inside the repository but are not part of the supported root API.

This keeps private Prisma driver utility types out of generated JSR documentation.

## Basic Usage

Create the adapter factory and pass it to Prisma Client:

```typescript
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

The adapter factory opens pooled MySQL connections when Prisma connects.

Prisma owns the normal client lifecycle.

Call `prisma.$disconnect()` during application shutdown.

## Configuration

`MySqlConnectionConfig` accepts standard MySQL connection settings:

```typescript
const config = {
  hostname: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  db: 'app',
  poolSize: 5,
  timeout: 30_000,
};
```

`hostname` is the MySQL server host.

`port` defaults to `3306` when the underlying driver applies its default.

`username` is the database user.

`password` is optional when the server allows passwordless access.

`db` is the database/schema name.

`poolSize` controls the connection pool limit.

`timeout` controls the driver connection timeout in milliseconds.

TLS can be enabled with certificate material:

```typescript
const config = {
  hostname: 'mysql.example.net',
  username: 'app',
  password: Deno.env.get('MYSQL_PASSWORD'),
  db: 'app',
  tls: {
    mode: 'verify_identity',
    caCerts: [await Deno.readTextFile('ca.pem')],
  },
};
```

## Permissions

The adapter needs network permission to reach MySQL:

```powershell
deno run --allow-net app.ts
```

Applications that read secrets from environment variables need environment permission:

```powershell
deno run --allow-net --allow-env=MYSQL_PASSWORD app.ts
```

Applications that read TLS certificates from disk need file read permission:

```powershell
deno run --allow-net --allow-read=ca.pem app.ts
```

The package itself does not read environment variables.

The package itself does not read files.

The package itself does not spawn subprocesses.

## Capabilities

The adapter detects MySQL server capability information on first connection.

It enables relation joins for supported MySQL versions.

It disables relation joins for old MySQL versions.

It disables relation joins for MariaDB versions.

Capability detection is conservative when the server version cannot be read.

## Type Conversion

The adapter maps MySQL column metadata to Prisma column types.

Integer columns map to Prisma integer types.

Decimal columns map to Prisma numeric values.

Date and time columns are normalized for Prisma transport.

JSON columns map to Prisma JSON.

Binary values are transported as bytes.

BigInt values are returned as strings where Prisma expects transport-safe values.

## Error Mapping

The adapter maps common MySQL errors to Prisma driver error kinds.

Unique constraint violations map to `UniqueConstraintViolation`.

Foreign key failures map to `ForeignKeyConstraintViolation`.

Missing databases map to `DatabaseDoesNotExist`.

Authentication failures map to `AuthenticationFailed`.

Unknown MySQL errors are preserved with MySQL code, message, state, and cause data.

## Transactions

The adapter starts transactions by checking out a pooled connection.

It applies the requested isolation level when Prisma provides one.

It begins the transaction before returning the transaction adapter.

It releases the connection after commit or rollback.

The implementation guards against duplicate commit or rollback calls.

## Examples

The repository includes `examples/basic-usage.ts`.

Examples are intentionally excluded from the JSR publish payload.

They may reference generated Prisma clients or local runtime assumptions that do not belong in the
package artifact.

Runnable documentation examples used for package gates live under `tests/`.

## Testing

Run type checking:

```powershell
deno task check
```

Run tests:

```powershell
deno task test
```

Run lint:

```powershell
deno task lint
```

Run format validation:

```powershell
deno task fmt
```

Run publish dry-run:

```powershell
deno task publish:dry-run
```

The focused tests cover pure conversion, capability, and error mapping behavior.

Live database integration tests are deferred to higher-level runtime validation.

## Package Layout

`mod.ts` is the package root.

`src/mod.ts` owns the internal export barrel.

`src/adapter.ts` owns the Prisma driver adapter factory and connection lifecycle.

`src/conversion.ts` owns MySQL-to-Prisma value conversion.

`src/errors.ts` owns MySQL-to-Prisma error mapping.

`src/types.ts` owns public configuration and driver-shape types.

`docs/` contains package documentation for architecture, concepts, setup, recipes, and reference.

`examples/` contains local examples and is excluded from publish.

`tests/` contains package tests and is excluded from publish.

## Stability

This package is alpha software.

Public root types are intended to be stable within the `0.0.1-alpha.0` release line.

Implementation helpers may change without a compatibility alias.

Avoid importing from `src/` in consuming packages.

Use the package root import instead.

## License

Apache-2.0.
