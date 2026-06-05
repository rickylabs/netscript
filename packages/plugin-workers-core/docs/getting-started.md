# Getting Started

Use the root entrypoint for stable, high-frequency APIs.

```ts
import { createSuccessResult, defineJob, startWorkers } from '@netscript/plugin-workers-core';

const job = defineJob('hello-workers')
  .handler(() => createSuccessResult({ ok: true }))
  .build();

const runtime = await startWorkers();
await runtime.jobRegistry.saveJob(job);
```

Use subpaths for specialized APIs:

```ts
import { createTestWorkersRuntime } from '@netscript/plugin-workers-core/testing';
import { workersContractV1 } from '@netscript/plugin-workers-core/contracts/v1';
```
