---
title: Testing Runtime Config
description: Test pattern for temporary runtime config directories.
package: '@netscript/runtime-config'
order: 11
---

# Testing

Tests can point `NETSCRIPT_RUNTIME_CONFIG_DIR` at a temporary directory.

```ts
import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { loadRuntimeConfig } from '@netscript/runtime-config';

const dir = await Deno.makeTempDir();
Deno.env.set('NETSCRIPT_RUNTIME_CONFIG_DIR', dir);

try {
  await Deno.writeTextFile(join(dir, 'current'), '1.0.0');
  const config = await loadRuntimeConfig();
  assertEquals(config.jobs, []);
} finally {
  Deno.env.delete('NETSCRIPT_RUNTIME_CONFIG_DIR');
  await Deno.remove(dir, { recursive: true });
}
```

Keep watcher tests narrow. Prefer testing loader behavior and callback invocation over relying on
operating-system watcher timing.
