# Testing Locally

Use the testing subpath for memory-backed ports and fixtures.

```ts
import { createJobFixture, createTestWorkersRuntime } from '@netscript/plugin-workers-core/testing';

const runtime = createTestWorkersRuntime();
const job = createJobFixture();

await runtime.jobRegistry.saveJob(job);
await runtime.worker.dispatch(job, {
  id: 'execution-1',
  job,
  payload: {},
});
```

Each call creates fresh state. Tests should create a new runtime instead of resetting global
singletons.
