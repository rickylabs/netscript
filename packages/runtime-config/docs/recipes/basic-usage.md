---
title: Runtime Config Basic Usage
description: Common loader and accessor patterns for runtime overrides.
package: '@netscript/runtime-config'
order: 10
---

# Basic Usage

Load once at startup:

```ts
import { getRuntimeTask, isFeatureEnabled, loadRuntimeConfig } from '@netscript/runtime-config';

const config = await loadRuntimeConfig();

const routingEnabled = isFeatureEnabled(config, 'new-routing', false);
const reportTask = getRuntimeTask(config, 'daily-report');
```

Then hand the snapshot to the runtime that owns behavior:

```ts
await workerRuntime.applyOverrides({
  routingEnabled,
  reportTask,
});
```

The package deliberately returns data instead of applying behavior.
