# Paginated Contract Recipe

Use the root package for offset pagination contracts.

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

Keep endpoint-specific filter schemas in the package or plugin that owns the endpoint. Use
`@netscript/contracts/query` only when the implementation needs reusable query execution helpers.
