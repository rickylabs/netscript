---
title: Getting Started
description: First steps with @netscript/config.
package: '@netscript/config'
order: 3
---

# Getting Started

Install the package:

```bash
deno add jsr:@netscript/config@0.0.1-alpha.1
```

Create `netscript.config.ts`:

```ts
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  databases: { active: 'postgres', config: [] },
  services: { api: { port: 3000 } },
});
```

Load it:

```ts
import { loadConfig } from '@netscript/config';

const config = await loadConfig();
console.log(config.name);
```
