---
title: Basic Shared Usage
description: Compose base contracts, schemas, and shared error helpers.
package: '@netscript/shared'
order: 10
---

# Basic Usage

Use `baseContract` when a package or plugin needs the common NetScript oRPC error map.

```ts
import { baseContract, SuccessSchema } from '@netscript/shared';

export const healthContract = baseContract
  .route({ method: 'GET', path: '/health' })
  .output(SuccessSchema);
```

Use `notFound()` only inside an oRPC handler that already provides an `errors` container.
