# @netscript/contracts

> Contract primitives, shared error data, pagination schemas, CRUD helpers, query helpers, and
> transform helpers for NetScript packages and plugins.

[![JSR](https://jsr.io/badges/@netscript/contracts)](https://jsr.io/@netscript/contracts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@netscript/contracts` is the foundation package for NetScript contract vocabulary.

It replaces the earlier `@netscript/shared` package name because the exported surface is not a
generic shared utility library. The package exists for contract-first APIs: base oRPC composition,
common error payloads, pagination shapes, schema helper factories, result types, and narrow helpers
that support contract implementation.

The public entry points are intentionally explicit:

- `@netscript/contracts` for base contract, common errors, pagination schemas, result types, and
  schema helper factories.
- `@netscript/contracts/crud` for CRUD contract generators.
- `@netscript/contracts/query` for pagination query helpers and query filter helpers.
- `@netscript/contracts/transform` for mapping persistence records into public contract shapes.

The package is small enough for early-wave consumers and named closely enough for public JSR
publication. It no longer exposes a workspace-only `@shared/utils` alias.

## Quickstart

Install the package from JSR:

```bash
deno add jsr:@netscript/contracts
```

Use the root entry point for common contract vocabulary:

```ts
import { baseContract, OffsetPaginationQuerySchema, SuccessSchema } from '@netscript/contracts';
import { z } from 'zod';

export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    items: z.array(z.unknown()),
    meta: SuccessSchema,
  }));
```

Use the subexports when you need richer helper APIs:

```ts
import { createCrudContract } from '@netscript/contracts/crud';
import { paginatedQuery } from '@netscript/contracts/query';
import { createTransformer } from '@netscript/contracts/transform';
```

## Mental model

Think of `@netscript/contracts` as the contract vocabulary package.

It does not own service workflows.

It does not own persistence.

It does not own plugin runtime behavior.

It does not depend on application packages.

It only owns vocabulary and helpers that must be identical across packages:

- contract route setup;
- common error payload shapes;
- common pagination input and output shapes;
- common validation builder names;
- result vocabulary for expected fallible operations;
- focused CRUD, query, and transform helpers.

The package uses Zod at runtime, but the documented root surface avoids exporting Zod class types.
That keeps JSR docs clean and avoids leaking private dependency internals into NetScript package
documentation.

## API

### Root contract primitive

`baseContract` is an oRPC contract-first builder with NetScript's common error map applied.

```ts
import { baseContract } from '@netscript/contracts';
import { z } from 'zod';

export const healthContract = baseContract
  .route({ method: 'GET', path: '/health' })
  .output(z.object({ status: z.literal('ok') }));
```

The exported `BaseContractProcedure` type is intentionally opaque. It carries the public oRPC marker
needed by consumers while keeping dependency-private types out of generated docs.

### Pagination schemas

Use offset pagination when a list endpoint accepts `limit` and `offset`.

```ts
import { OffsetPaginationMetaSchema, OffsetPaginationQuerySchema } from '@netscript/contracts';
import { z } from 'zod';

export const listOutput = z.object({
  items: z.array(z.unknown()),
  pagination: OffsetPaginationMetaSchema,
});

OffsetPaginationQuerySchema.parse({ limit: '20', offset: '0' });
```

Use cursor pagination when a list endpoint advances by opaque cursor.

```ts
import { CursorPaginationInputSchema, CursorPaginationMetaSchema } from '@netscript/contracts';

CursorPaginationInputSchema.parse({ limit: 25, cursor: 'next-page' });
CursorPaginationMetaSchema.parse({ limit: 25, nextCursor: null, hasMore: false });
```

### Error schemas

Common error schemas describe error data, not transport behavior.

- `NotFoundErrorSchema`
- `ValidationErrorSchema`
- `UnauthorizedErrorSchema`
- `ForbiddenErrorSchema`
- `RateLimitErrorSchema`
- `ServiceUnavailableErrorSchema`

The common error map used by `baseContract` binds those schemas to stable codes:

- `NOT_FOUND`
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RATE_LIMITED`
- `SERVICE_UNAVAILABLE`

### Validation helpers

Validation helper factories return Zod-backed schema values through package-owned schema interfaces.

- `positiveInt()`
- `nonNegativeInt()`
- `paginationLimit()`
- `paginationOffset()`
- `boundedString()`
- `positiveNumber()`
- `nonNegativeNumber()`
- `stringToNumber()`
- `stringToInt()`

```ts
import { boundedString, paginationLimit, stringToInt } from '@netscript/contracts';

const name = boundedString({ max: 80, description: 'Display name' });
const limit = stringToInt(paginationLimit());

name.parse('example');
limit.parse('50');
```

### Error helpers

`notFound()` throws the shared `NOT_FOUND` oRPC error with resource context inferred from the route.

```ts
import { notFound } from '@netscript/contracts';

export const getJob = router.getJob.handler(async ({ input, errors, path }) => {
  const job = await registry.get(input.id);
  if (!job) {
    notFound({ errors, path, resourceId: input.id });
  }
  return job;
});
```

`getResourceType()` turns common route path values into readable resource names.

### Diagnostics

`inspectContracts()` creates a small JSON-stable report for a value.

```ts
import { inspectContracts, SuccessSchema } from '@netscript/contracts';

const report = inspectContracts(SuccessSchema);
```

### CRUD Subexport

`@netscript/contracts/crud` owns resource contract generators. It is separate from the root so the
base vocabulary remains compact.

```ts
import { createCrudContract } from '@netscript/contracts/crud';

export const usersContract = createCrudContract({
  resource: 'users',
  entitySchema: UserSchema,
  createSchema: CreateUserSchema,
  updateSchema: UpdateUserSchema.partial(),
});
```

The generated operations follow the standard list, get-by-id, create, update, and delete shape.
Callers may disable individual operations for read-only or list-only resources.

### Query Subexport

`@netscript/contracts/query` owns pagination execution helpers and dynamic filter helpers.

```ts
import { buildPrismaWhere, paginatedQuery } from '@netscript/contracts/query';

const where = buildPrismaWhere([
  { field: 'status', operator: 'equals', value: 'active' },
]);

const result = await paginatedQuery(db.user, { page: 1, limit: 20, where });
```

### Transform Subexport

`@netscript/contracts/transform` owns small mapping helpers for turning storage records into
contract response shapes.

```ts
import { createTransformer } from '@netscript/contracts/transform';

const publicUser = createTransformer((user: UserRecord) => ({
  id: user.id,
  name: user.name,
}));
```

## Recipes

### Add a paginated endpoint

1. Import `baseContract` and `OffsetPaginationQuerySchema`.
2. Bind the query schema with `.input()`.
3. Return a response schema that includes `OffsetPaginationMetaSchema`.
4. Keep endpoint-specific filters in the plugin or package that owns the endpoint.

```ts
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/contracts';
import { z } from 'zod';

export const listRuns = baseContract
  .route({ method: 'GET', path: '/runs' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    runs: z.array(z.unknown()),
    pagination: OffsetPaginationMetaSchema,
  }));
```

### Add a common failure response

Use the shared schema when the error data matches the common vocabulary.

```ts
import { NotFoundErrorSchema } from '@netscript/contracts';

NotFoundErrorSchema.parse({
  resourceType: 'Job',
  resourceId: 'nightly-build',
});
```

If the error needs package-specific fields, define that schema in the owning package instead.

### Keep a published plugin importable

Published plugins should import common contract vocabulary from the root package:

```ts
import { baseContract, notFound } from '@netscript/contracts';
```

Do not publish imports from workspace-only aliases such as `@contracts` or local application roots.

## Configuration

The package has no runtime configuration.

Its `deno.json` defines:

- the package name and lockstep version;
- the root and named subexport map;
- dependency imports for oRPC and Zod;
- strict compiler options;
- publish includes for `README.md`, `docs/**/*.md`, entrypoints, `src/**/*.ts`, and helper
  implementation folders;
- publish excludes for tests and test utilities.

No environment variables are read.

No filesystem permissions are required by the published root surface.

## Testing

Run the package tests from the repository root:

```bash
deno test --allow-all packages/contracts
```

Run the documentation lint gate:

```bash
deno doc --lint packages/contracts/mod.ts packages/contracts/crud.ts packages/contracts/query.ts packages/contracts/transform.ts
```

Run the JSR slow-type gate from the package directory:

```bash
cd packages/contracts
deno publish --dry-run --allow-dirty
```

Run the standards gate from the repository root:

```bash
deno run --allow-read .llm/tools/fitness/check-netscript-standards.ts --root packages/contracts --text
```

Run the workspace check from the repository root:

```bash
deno task check
```

## Observability

`@netscript/contracts` does not emit logs, metrics, traces, or spans.

It provides `inspectContracts()` for low-cost diagnostics when a caller needs a serializable view of
a contract value.

The report shape is intentionally small:

- `packageName`
- `status`
- `summary`
- `details`

Telemetry packages may compose this diagnostic data, but this package does not import telemetry.

## Architecture

The published root module is barrel-only:

```ts
export * from './src/public/mod.ts';
```

The implementation split is:

- `src/domain/` for constants, schema types, data schemas, results, and error data helpers.
- `src/application/` for Zod-backed helper factories, the oRPC base contract primitive, and
  query/transform helper implementations.
- `src/diagnostics/` for inspection reports.
- `src/public/` for the package barrel.
- `crud/` for CRUD contract generators.
- `schemas/` for richer query helper schemas.

This package follows the A1 small-contract root archetype with named subexports for richer APIs:

- small root surface;
- explicit public types;
- no application coupling;
- no cross-package side effects;
- no broad compatibility aliases in the published JSR map.

## Stability

The current version is `0.0.1-alpha.0`.

Alpha means the package may change shape between waves while the repository converges on the package
quality baseline.

The package does not add backward-compatibility aliases solely to preserve stale imports.

The retired `packages/shared` package is not part of the public package graph.

## Compatibility

`@netscript/contracts` is intended for Deno and JSR consumers.

The package keeps path imports in source. Deno publish rewrites those imports for JSR.

Published code should use:

```ts
import { baseContract } from '@netscript/contracts';
```

Repository-local plugin code should also use:

```ts
import { notFound } from '@netscript/contracts';
```

Workspace aliases such as `@shared/utils` are retired.

## License

MIT. See the repository `LICENSE` file.
