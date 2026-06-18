# @netscript/config

Typed NetScript project configuration: schemas, loaders, environment helpers, and scaffold constants.

## Install

```sh
deno add jsr:@netscript/config
```

Schema-only APIs live on a focused subpath so the root surface does not leak Zod internals:

```ts
import { pluginEntrySchema } from '@netscript/config/schema/plugins';
```

## Quick example

Define a project config once in `netscript.config.ts`:

```ts
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  version: '1.0.0',
  services: {
    api: { port: 3000 },
  },
});
```

At runtime, read the validated config and inspect it:

```ts
import { getConfig, inspectConfig } from '@netscript/config';

const config = getConfig();
const report = inspectConfig(config);

console.log(report.summary);
```

Use `defineConfigAsync()` when configuration depends on the current command or environment mode, and
`resolveEnv()` / `getEnv()` to read typed environment variables.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/config/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
