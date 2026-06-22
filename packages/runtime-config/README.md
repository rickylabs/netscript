# @netscript/runtime-config

Hot-reloadable NetScript runtime override types, loaders, watchers, and diagnostics.

## Install

```sh
deno add jsr:@netscript/runtime-config
```

## Quick example

Load the active runtime override snapshot once, then resolve feature flags and per-unit
overrides without recompiling the service:

```ts
import {
  getJobOverride,
  isFeatureEnabled,
  loadRuntimeConfig,
} from '@netscript/runtime-config';

const config = await loadRuntimeConfig();

if (!isFeatureEnabled(config, 'email-worker', true)) {
  // feature flag is off — skip the worker
}

const cleanup = getJobOverride(config, 'cleanup');
if (cleanup?.enabled === false) {
  // job override disables the scheduled cleanup
}
```

Missing runtime files produce empty defaults, so a process can start with no runtime directory and
begin honoring overrides once deployment tooling creates them. Use `watchRuntimeConfig()` to reload
after a file changes, and `summarizeRuntimeConfig()` for caller-owned diagnostics.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/runtime-config/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
