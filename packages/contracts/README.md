# @netscript/contracts

Contract-first primitives for NetScript: the oRPC base contract, shared error data, pagination schemas, result types, and schema/CRUD/query/transform helpers.

## Install

```sh
deno add jsr:@netscript/contracts
```

Focused subpath imports are available for richer helper APIs:

```ts
import { createCrudContract } from '@netscript/contracts/crud';
import { buildPrismaWhere, paginatedQuery } from '@netscript/contracts/query';
import { createTransformer } from '@netscript/contracts/transform';
```

## Quick example

Use the root entry point for the common contract vocabulary — the oRPC base contract plus shared pagination schemas:

```ts
import { baseContract, OffsetPaginationMetaSchema, OffsetPaginationQuerySchema } from '@netscript/contracts';
import { z } from 'zod';

export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    items: z.array(z.unknown()),
    pagination: OffsetPaginationMetaSchema,
  }));
```

`baseContract` carries NetScript's common error map (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`,
`FORBIDDEN`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`). Use `notFound()` to raise the shared `NOT_FOUND`
error with inferred resource context, and the validation factories (`boundedString()`,
`paginationLimit()`, `stringToInt()`, and friends) to build reusable schema values.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/contracts/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
