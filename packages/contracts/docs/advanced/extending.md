# Extending Contracts

Extend `@netscript/contracts` by composing local schemas around the shared primitives. The package
owns common contract vocabulary; service-specific fields, filters, and response bodies stay with the
service, package, or plugin that owns that behavior.

## Compose local output schemas

```ts
import {
  baseContract,
  OffsetPaginationMetaSchema,
  OffsetPaginationQuerySchema,
} from '@netscript/contracts';
import { z } from 'zod';

const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'archived']),
});

export const listProjectsContract = baseContract
  .route({ method: 'GET', path: '/projects' })
  .input(OffsetPaginationQuerySchema)
  .output(z.object({
    projects: z.array(ProjectSummarySchema),
    pagination: OffsetPaginationMetaSchema,
  }));
```

## Keep extension axes named

When a contract needs variation, name the variation in the consuming package instead of adding a
generic helper here. Examples:

- `ProjectSummarySchema` for a read-model projection.
- `ProjectFilterSchema` for endpoint-owned filters.
- `ProjectExportContract` for a workflow-specific output shape.

Promote a helper into `@netscript/contracts` only when more than one package needs the same stable
shape and the shape is independent of a specific service.

## Use subpaths deliberately

- `@netscript/contracts/crud` creates conventional resource contracts.
- `@netscript/contracts/query` contains implementation-side pagination query helpers.
- `@netscript/contracts/transform` maps storage records into public contract shapes.

The root package remains the preferred import for shared schemas and base contract primitives.
