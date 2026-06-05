# @netscript/shared

Shared schemas and utilities for NetScript packages.

This package owns framework-level primitives that must be consumable by publishable plugins without
importing an application workspace. It includes shared contract schemas, the `baseContract` oRPC
primitive, Zod codecs, numeric validators, and typed error helpers.

## Exports

- `baseContract` and shared error/response schemas from `contracts.ts`.
- Pagination schemas and derived types.
- Zod validation helpers and codecs from `utils/`.
- Error helpers such as `notFound()`.

## Example

```ts
import { baseContract, paginationLimit, stringToInt } from '@netscript/shared';
import { z } from 'zod';

const listInput = z.object({
  limit: stringToInt(paginationLimit()),
});

export const contract = {
  list: baseContract
    .route({ method: 'GET', path: '/items' })
    .input(listInput)
    .output(z.object({ items: z.array(z.unknown()) })),
};
```

## Publish Notes

Published plugins should import shared framework primitives from this package instead of root
application aliases such as `@contracts`.
