---
title: Plugin Appsettings Schemas
description: Validate plugin and background processor appsettings entries.
package: '@netscript/config'
order: 11
---

# Plugin Appsettings Schemas

Use `@netscript/config/schema/plugins` to validate generated AppHost appsettings fragments.

```ts
import { pluginEntrySchema } from '@netscript/config/schema/plugins';

const entry = pluginEntrySchema.parse({
  Port: 8091,
  InstalledVersion: '0.0.1-alpha.0',
  InstalledFrom: 'jsr:@netscript/plugin-workers@^0.0.1-alpha.0',
});
```

The schema applies defaults for runtime, entrypoint, enablement, and dependency flags.

Background processors use `backgroundProcessorEntrySchema` and default to `bin/combined.ts` as their
entrypoint.
