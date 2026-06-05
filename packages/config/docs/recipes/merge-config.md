---
title: Merge Config Contributions
description: Merge plugin-provided partial config fragments into validated NetScript config.
package: '@netscript/config'
order: 10
---

# Merge Config Contributions

Use `@netscript/config/merge` when a plugin manifest contributes project config.

```ts
import { mergePartialConfig } from '@netscript/config/merge';

const next = mergePartialConfig(config, {
  services: {
    'workers-api': { port: 8091 },
  },
  apps: {
    admin: { port: 5173 },
  },
});
```

Services and apps default their runtime to `deno` when a contribution omits it.

Database entries merge by `name` when present, otherwise by `schema`.
