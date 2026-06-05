---
title: Getting Started with Shared
description: Install and use the shared package in a contract-first endpoint.
package: '@netscript/shared'
order: 4
---

# Getting Started

Install the package from JSR:

```bash
deno add jsr:@netscript/shared
```

Import only from the root entry point:

```ts
import { baseContract, OffsetPaginationQuerySchema } from '@netscript/shared';
import { z } from 'zod';

export const listItems = baseContract
  .route({ method: 'GET', path: '/items' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({ items: z.array(z.unknown()) }));
```

Use the shared package for cross-package vocabulary only. Keep endpoint-specific filters, clocks,
stores, and runtime policy in the owning package or plugin.
