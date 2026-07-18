# @netscript/config

[![JSR](https://jsr.io/badges/@netscript/config)](https://jsr.io/@netscript/config)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The typed project-configuration surface for NetScript: author a project config once with
`defineConfig`, load and cache it at startup, and read a validated `NetScriptConfig` that framework
packages, the CLI, and generators consume.**

Every NetScript project carries one source of truth for its topology — databases, services, plugins,
deploy targets, saga and trigger groups — and every framework package reads the same validated
object instead of parsing files itself. `defineConfig` in `netscript.config.ts` validates that
config at definition time; `initConfig` resolves and caches it once per process; `getConfig` then
serves it synchronously to everything downstream. When configuration depends on the current command
or environment mode, `defineConfigAsync` resolves it lazily.

## Why teams use it

- **Typed authoring** — `defineConfig` and `defineConfigAsync` validate a `NetScriptConfig` at
  definition time, so a typo in a provider name or port fails before the process boots.
- **Loader and runtime cache** — `loadConfig`, `initConfig`, `getConfig`, `isConfigLoaded`, and
  `clearConfigCache` resolve the authored config once and serve the validated object synchronously
  to the rest of the process.
- **Environment helpers** — `resolveEnv`, `getEnv`, `hasEnv`, and the `getMode` / `isDev` / `isProd`
  / `isTest` predicates read typed, coerced environment variables.
- **Workspace discovery** — `discoverWorkspace`, `findWorkspaceRoot`, `findMember`, and
  `getMemberEntrypoint` classify Deno workspace members for the CLI and generators.
- **Subpath schemas without Zod leakage** — `@netscript/config/merge` folds plugin-contributed
  config fragments, `@netscript/config/paths` exposes scaffold constants, and
  `@netscript/config/schema/plugins` validates appsettings plugin entries — kept off the root
  surface so it never leaks Zod internals.

## Install

```bash
deno add jsr:@netscript/config@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Define a project config once in `netscript.config.ts`:

```typescript
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  version: '1.0.0',
  databases: {
    active: 'postgres',
    config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
  },
  services: {
    api: { port: 3000 },
  },
});
```

Load and cache it at process startup, then read the validated config synchronously anywhere:

```typescript
import { getConfig, initConfig, inspectConfig } from '@netscript/config';

await initConfig();
const config = getConfig();
console.log(config.name, config.databases.active); // "orders" "postgres"

const report = inspectConfig(config);
console.log(report.summary);
```

## Public surface

| Entry              | What it gives you                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `.`                | `defineConfig` / `defineConfigAsync`, loader + cache, env helpers, workspace discovery, `inspectConfig` |
| `./merge`          | `mergePartialConfig` — folds plugin-contributed `PartialConfig` fragments into one config               |
| `./paths`          | `SCAFFOLD_DIRS`, `SCAFFOLD_FILES`, `PERMISSIONS` — scaffold and permission constants                    |
| `./schema/plugins` | Zod-backed validators for appsettings plugin entries (`pluginEntrySchema`, …)                           |

The always-current symbol list is
[`deno doc jsr:@netscript/config@<version>`](https://jsr.io/@netscript/config/doc) (pin `<version>`
on the pre-release line, as above).

## Docs

- **Reference — schema, loader, env, and workspace APIs**:
  [rickylabs.github.io/netscript/reference/config/](https://rickylabs.github.io/netscript/reference/config/)
- **Orchestration & Runtime — where project config fits**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **API docs on JSR**: [jsr.io/@netscript/config/doc](https://jsr.io/@netscript/config/doc)

## Compatibility

Requires Deno 2+. Loading a config file needs `--allow-read`; the environment helpers need
`--allow-env` for the variables they read. The schema subpaths are pure and need no permissions.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
