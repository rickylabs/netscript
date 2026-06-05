# Getting Started

Register the plugin through the host configuration:

```ts
export default {
  plugins: ['./plugins/workers/mod.ts'],
};
```

Import the manifest when a host or test needs to inspect plugin metadata:

```ts
import { inspectWorkers, workersPlugin } from '@netscript/plugin-workers';

console.log(inspectWorkers(workersPlugin));
```

## Add A Job

Use the CLI subpath through the host CLI walker. The command backend can scaffold job source and
compile the static registry.

```powershell
deno run --allow-read --allow-write ./path/to/host-cli.ts workers add-job send-email
deno run --allow-read --allow-write ./path/to/host-cli.ts workers compile-registry
```

The generated registry imports job modules statically from `workers/jobs/**/*.ts`.

## Use Core Definitions

Application code should define jobs with `@netscript/plugin-workers-core`:

```ts
import { createSuccessResult, defineJob } from '@netscript/plugin-workers-core';

export const job = defineJob('send-email')
  .handler(() => createSuccessResult({ sent: true }))
  .build();
```

The plugin then provides host integration around those definitions.
