# Getting Started

Use `@netscript/contracts` as the shared vocabulary for service and plugin contract boundaries.
The root export contains the base oRPC contract, standard response schemas, pagination contracts,
result helpers, and schema helper factories.

## Install

Import from the package root for shared contract primitives:

```ts
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
  SuccessSchema,
} from '@netscript/contracts';
```

Use subpaths when you need a focused helper family:

```ts
import { createCrudContract } from '@netscript/contracts/crud';
import { paginatedQuery } from '@netscript/contracts/query';
import { createTransformer } from '@netscript/contracts/transform';
```

## Define a route

```ts
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { z } from 'zod';

export const healthContract = baseContract
  .route({ method: 'GET', path: '/health' })
  .output(SuccessSchema.extend({
    service: z.string(),
  }));
```

Keep endpoint-specific schemas in the service, package, or plugin that owns the endpoint. Promote a
schema into `@netscript/contracts` only when multiple packages must share exactly the same shape.

## Add pagination

```ts
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/contracts';
import { z } from 'zod';

export const listItemsContract = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    items: z.array(z.unknown()),
    pagination: OffsetPaginationMetaSchema,
  }));
```

Use `@netscript/contracts/query` in implementation code when a Prisma-style model delegate should
execute the shared pagination conventions.
