# @netscript/shared

> Shared contract primitives, pagination schemas, validation helpers, and diagnostic utilities for
> NetScript packages and plugins.

[![JSR](https://jsr.io/badges/@netscript/shared)](https://jsr.io/@netscript/shared)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@netscript/shared` is the Wave 0 foundation package for the NetScript package graph.

It exists so packages and plugins can agree on a small set of contract vocabulary without importing
application code, generated project files, or package-specific implementation details.

The package is intentionally narrow:

- `baseContract` for oRPC contract-first endpoints with shared error definitions.
- Pagination schemas and response metadata types.
- Common error data schemas for not-found, validation, auth, rate-limit, and service-unavailable
  cases.
- Zod-backed validation helper factories with documented package-owned public types.
- `notFound()` and `getResourceType()` for typed not-found data.
- `inspectShared()` for JSON-stable diagnostics.

The public root is a barrel-only module. Implementation files live in `src/` and are grouped by
domain, application, diagnostics, and public surface.

## Quickstart

Install the package from JSR:

```bash
deno add jsr:@netscript/shared
```

Use the root entry point for all published imports:

```ts
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/shared';
import { z } from 'zod';

export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    items: z.array(z.unknown()),
    pagination: OffsetPaginationMetaSchema,
  }));
```

During local workspace development, some later-wave plugins still import the legacy unpublished
`@shared/utils` alias. That compatibility path is not part of the published JSR export map.

## Mental model

Think of `@netscript/shared` as the type substrate.

It does not own service workflows.

It does not own persistence.

It does not own plugin runtime behavior.

It does not depend on application packages.

It only owns vocabulary that must be identical across packages:

- contract route setup;
- common error payload shapes;
- common pagination input and output shapes;
- common validation builder names;
- small diagnostic reporting.

The package uses Zod at runtime, but the documented public surface avoids exporting Zod class types.
That keeps JSR docs clean and avoids leaking private dependency internals into NetScript package
documentation.

## API

### Contract primitive

`baseContract` is an oRPC contract-first builder with NetScript's shared error map applied.

```ts
import { baseContract } from '@netscript/shared';
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
import { OffsetPaginationMetaSchema, OffsetPaginationQuerySchema } from '@netscript/shared';
import { z } from 'zod';

export const listOutput = z.object({
  items: z.array(z.unknown()),
  pagination: OffsetPaginationMetaSchema,
});

OffsetPaginationQuerySchema.parse({ limit: '20', offset: '0' });
```

Use cursor pagination when a list endpoint advances by opaque cursor.

```ts
import { CursorPaginationInputSchema, CursorPaginationMetaSchema } from '@netscript/shared';

CursorPaginationInputSchema.parse({ limit: 25, cursor: 'next-page' });
CursorPaginationMetaSchema.parse({ limit: 25, nextCursor: null, hasMore: false });
```

### Error schemas

Shared error schemas describe error data, not transport behavior.

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
import { boundedString, paginationLimit, stringToInt } from '@netscript/shared';

const name = boundedString({ max: 80, description: 'Display name' });
const limit = stringToInt(paginationLimit());

name.parse('example');
limit.parse('50');
```

### Error helpers

`notFound()` creates stable not-found error data.

```ts
import { notFound } from '@netscript/shared';

const data = notFound('SagaDefinition', 'billing-retry');
```

`getResourceType()` turns common resource values into readable names.

### Diagnostics

`inspectShared()` creates a small JSON-stable report for a value.

```ts
import { inspectShared, SuccessSchema } from '@netscript/shared';

const report = inspectShared(SuccessSchema);
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
} from '@netscript/shared';
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
import { NotFoundErrorSchema } from '@netscript/shared';

NotFoundErrorSchema.parse({
  resourceType: 'Job',
  resourceId: 'nightly-build',
});
```

If the error needs package-specific fields, define that schema in the owning package instead.

### Keep a published plugin importable

Published plugins should import from the root package:

```ts
import { baseContract } from '@netscript/shared';
```

Do not publish imports from workspace-only aliases such as `@contracts` or local application roots.

## Configuration

The package has no runtime configuration.

Its `deno.json` defines:

- the package name and lockstep version;
- a single root export map;
- dependency imports for oRPC and Zod;
- strict compiler options;
- publish includes for `README.md`, `docs/**/*.md`, `deno.json`, `mod.ts`, and `src/**/*.ts`;
- publish excludes for tests, examples, and the legacy unpublished `utils/` folder.

No environment variables are read.

No filesystem permissions are required by the published root surface.

## Testing

Run the package tests from the repository root:

```bash
deno test --allow-all packages/shared
```

Run the documentation lint gate:

```bash
deno doc --lint packages/shared/mod.ts
```

Run the JSR slow-type gate from the package directory:

```bash
cd packages/shared
deno publish --dry-run --allow-dirty
```

Run the standards gate from the repository root:

```bash
deno run --allow-read tools/fitness/check-netscript-standards.ts --root packages/shared --text
```

Run the workspace check from the repository root:

```bash
deno task check
```

## Observability

`@netscript/shared` does not emit logs, metrics, traces, or spans.

It provides `inspectShared()` for low-cost diagnostics when a caller needs a serializable view of a
shared value.

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
- `src/application/` for Zod-backed helper factories and the oRPC base contract primitive.
- `src/diagnostics/` for inspection reports.
- `src/public/` for the package barrel.

This package follows the A1 small-contract archetype:

- small exported surface;
- explicit public types;
- no application coupling;
- no cross-package side effects;
- no broad compatibility aliases in the published JSR map.

## Stability

The current version is `0.0.1-alpha.0`.

Alpha means the package may change shape between waves while the repository converges on the package
quality baseline.

The package does not add backward-compatibility aliases solely to preserve stale imports.

The legacy `utils/` folder remains in the workspace for current plugin consumers, but it is excluded
from the published package.

## Compatibility

`@netscript/shared` is intended for Deno and JSR consumers.

The package keeps path imports in source. Deno publish rewrites those imports for JSR.

Published code should use:

```ts
import { baseContract } from '@netscript/shared';
```

Repository-local later-wave plugin code may temporarily use:

```ts
import { notFound } from '@shared/utils';
```

That alias is not part of the published export map and should be retired by the owning plugin waves.

## License

MIT. See the repository `LICENSE` file.
