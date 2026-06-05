---
title: Paginated Contract Recipe
description: Add offset pagination input and response metadata to a list endpoint.
package: '@netscript/shared'
order: 11
---

# Paginated Contract

Use `OffsetPaginationQuerySchema` for list endpoints that accept `limit` and `offset`.

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

Keep endpoint-specific filters in the owning package or plugin.
