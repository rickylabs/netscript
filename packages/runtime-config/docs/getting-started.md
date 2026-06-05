---
title: Getting Started With Runtime Config
description: Ten-minute first run guide for @netscript/runtime-config.
package: '@netscript/runtime-config'
order: 3
---

# Getting Started

Create a runtime directory:

```text
runtime/
  current
  jobs/
    v1.0.0.json
  features/
    v1.0.0.json
```

Write `runtime/current`:

```json
{
  "version": "1.0.0",
  "jobs": "jobs/v1.0.0.json",
  "features": "features/v1.0.0.json"
}
```

Write `runtime/jobs/v1.0.0.json`:

```json
{
  "overrides": [
    { "id": "cleanup", "enabled": false }
  ]
}
```

Load the snapshot:

```ts
import { getJobOverride, loadRuntimeConfig } from '@netscript/runtime-config';

const config = await loadRuntimeConfig();
const cleanup = getJobOverride(config, 'cleanup');
```

Set `NETSCRIPT_RUNTIME_CONFIG_DIR` when the runtime directory is not `./runtime`.
