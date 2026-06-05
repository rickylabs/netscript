# Adding a Job

Use `defineJob(id)` for job definitions.

```ts
import { createSuccessResult, defineJob } from '@netscript/plugin-workers-core';

export const syncCatalog = defineJob('sync-catalog')
  .handler(() => createSuccessResult({ synced: true }))
  .topic('workers.catalog')
  .tags('catalog')
  .build();
```

Use `.entrypoint(path)` when the job is loaded from generated registry output:

```ts
import { defineJob } from '@netscript/plugin-workers-core';

export const reportJob = defineJob('nightly-report')
  .entrypoint('./workers/jobs/nightly-report.ts')
  .schedule('0 2 * * *')
  .build();
```
