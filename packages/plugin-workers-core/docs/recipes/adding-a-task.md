# Adding a Task

Use `defineTask(id)` for executable task definitions.

```ts
import { defineTask } from '@netscript/plugin-workers-core';

export const buildAssets = defineTask('build-assets')
  .type('deno')
  .entrypoint('./tasks/build-assets.ts')
  .args('production')
  .timeout(60_000)
  .build();
```

Task execution is supplied by runtime adapters. The definition itself is pure data plus an optional
handler.
