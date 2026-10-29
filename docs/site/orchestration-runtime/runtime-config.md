---
layout: layouts/base.vto
title: Runtime configuration
templateEngine: [vento, md]
order: 2
---

# Runtime configuration

This page explains NetScript's two configuration layers, shows how to load each one, and lists the
types and functions you work with.

NetScript splits configuration into a **typed project config** that you author once in
`netscript.config.ts` and load at startup (`@netscript/config`), and a **hot-reloadable runtime
override layer** that operators roll out without redeploying (`@netscript/runtime-config`).
Defaults come from the schema, values from the config file and the environment, and last-mile
operational overrides apply at runtime.

{{ comp.diagram({ src: "/assets/diagrams/runtime-config-resolution.svg", alt: "Configuration resolution chain: schema defaults flow into the loaded config file, environment variables override typed values via resolveEnv, and hot-reloadable runtime override files apply last to produce a frozen resolved config.", caption: "Resolution chain — schema defaults → config file (defineConfig / loadConfig) → environment (resolveEnv / getEnv) → runtime override files (loadRuntimeConfig) → the validated config the framework reads." }) }}

## Two layers

| | Project config | Runtime overrides |
| --- | --- | --- |
| Package | `@netscript/config` | `@netscript/runtime-config` |
| Source | `netscript.config.ts`, authored with `defineConfig` (or `defineConfigAsync` when the shape depends on mode or command) and validated against a Zod schema. Environment variables feed in through `resolveEnv` / `getEnv`, which coerce and default typed values per call. | Versioned JSON files (jobs, sagas, triggers, features, tasks) under a `runtime/` directory, selected by a `current` version pointer. |
| Read with | `loadConfig` / `initConfig`, which resolve the file into a typed `NetScriptConfig` | `loadRuntimeConfig`, which returns a `RuntimeConfig` snapshot; `watchRuntimeConfig` reloads on change |
| Changed by | You, as the static, schema-validated topology of the app | An operator, without a redeploy |
| Use it for | Services, ports, databases, plugins and paths, with full TypeScript inference and Zod validation | Toggling a feature flag, disabling a job, saga or trigger, or adding a task |
| When values are missing | Schema defaults fill omitted fields | Missing files produce empty defaults, so startup never blocks on overrides that aren't rolled out yet |

`@netscript/config` owns the build-time contract and `@netscript/runtime-config` owns the
hot-reloadable operational layer. For a one-off typed read of a single environment variable, use
`getEnv`.

## Minimal example

Author the project config once, then load and inspect it at startup. The `runtimeConfig` section of
the project config sets where the generated runtime schema output lives:
`netscript generate runtime-schemas` derives those schemas from registered plugin metadata (see
[CLI & scaffold](/orchestration-runtime/cli-scaffold/)). `@netscript/runtime-config` reads the live
overrides separately.

```ts
// netscript.config.ts
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  version: '1.0.0',
  databases: {
    active: 'postgres',
    config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
  },
  services: {
    api: { port: 3000 }, // note: your scaffold's ports will differ
  },
  plugins: ['@netscript/plugin-workers'],
});
```

```ts
// src/bootstrap.ts — load project config + apply runtime overrides
import { initConfig, getConfig } from '@netscript/config';
import { isFeatureEnabled, loadRuntimeConfig } from '@netscript/runtime-config';

// 1. Project config: validated once, then read synchronously anywhere via getConfig().
await initConfig();
const config = getConfig();

// 2. Runtime overrides: hot-reloadable JSON the operator controls (empty if unset).
const runtime = await loadRuntimeConfig();
const rolloutOn = isFeatureEnabled(runtime, 'worker-rollout', false);

console.log(config.name, config.services?.api?.port, rolloutOn);
```

## Key types

You author `NetScriptConfigInput`; `loadConfig` and `initConfig` return the fully validated
`NetScriptConfig`. These are its load-bearing fields:

{{ comp.apiTable({
  caption: "NetScriptConfig — the validated project config (returned by loadConfig / initConfig / getConfig)",
  rows: [
    { name: "name", type: "string (required)", desc: "Project name." },
    { name: "version", type: "string (required)", desc: "Project version." },
    { name: "paths", type: "PathsConfig (required)", desc: "Workspace path conventions (services, packages, apps, workers, sagas, triggers, plugins, contracts, database, tasks, deploy)." },
    { name: "databases", type: "DatabasesConfig (required)", desc: "{ active?: provider, config: DatabaseConfig[] } — configured databases and the active selector." },
    { name: "plugins", type: "string[] (required)", desc: "Enabled plugin package names or specifiers." },
    { name: "services", type: "Record<string, ServiceConfig>?", desc: "Service configuration by service name." },
    { name: "apps", type: "Record<string, AppConfig>?", desc: "Frontend application configuration by app name." },
    { name: "logging", type: "LoggingConfig?", desc: "{ level, format, timestamps, colors? } logging behavior." },
    { name: "aspire", type: "AspireConfig?", desc: "{ appHost, dashboardPort } Aspire orchestration settings." },
    { name: "sagas / triggers / gateway / sdk / deploy", type: "section objects?", desc: "Optional per-capability config sections." },
    { name: "runtimeConfig", type: "RuntimeConfigSection?", desc: "Runtime schema/config OUTPUT settings (where generated runtime schema is written) — not the live overrides." }
  ]
}) }}

`loadRuntimeConfig()` returns the separate `RuntimeConfig` override snapshot. Each field is an
array loaded from one topic directory:

{{ comp.apiTable({
  caption: "RuntimeConfig — the hot-reloadable override snapshot (returned by loadRuntimeConfig)",
  rows: [
    { name: "jobs", type: "JobOverride[]", desc: "Job overrides from runtime/jobs/*.json (enabled, schedule, timeout, maxRetries, timezone, concurrency)." },
    { name: "sagas", type: "SagaOverride[]", desc: "Saga overrides from runtime/sagas/*.json (enabled, timeout, maxRetries, compensationTimeout)." },
    { name: "triggers", type: "TriggerOverride[]", desc: "Trigger overrides from runtime/triggers/*.json (enabled, paths)." },
    { name: "features", type: "FeatureFlag[]", desc: "Feature flags from runtime/features/*.json (id, enabled, description?, rolloutPercentage?)." },
    { name: "tasks", type: "RuntimeTask[]", desc: "Runtime task definitions from runtime/tasks/*.json (id, name, runtime, entrypoint, enabled?, timeout?, schedule?)." }
  ]
}) }}

## Resolution & precedence

Each package resolves values with its own precedence. The diagram shows the conceptual chain:

{{ comp.apiTable({
  caption: "How a value is resolved (lowest precedence first)",
  rows: [
    { name: "1. Schema defaults", type: "@netscript/config", desc: "Zod schema fills omitted fields when defineConfig validates the authored input into NetScriptConfig." },
    { name: "2. Config file", type: "loadConfig / initConfig", desc: "File search order: options.configFile → netscript.config.ts → .js → .mjs. cwd resolves from options.cwd → NETSCRIPT_PROJECT_ROOT → Deno.cwd()." },
    { name: "3. Environment", type: "resolveEnv / getEnv", desc: "Per-variable: read the env var (def.env overrides the name) and coerce by type (string|number|boolean|json); if absent, use default; if required and absent with no default, throw." },
    { name: "4. Runtime overrides", type: "loadRuntimeConfig", desc: "Hot-reloadable JSON under the runtime dir, keyed by the 'current' version pointer; applied per-id (job/saga/trigger/feature/task). Missing files → empty defaults." }
  ]
}) }}

{{ comp callout { type: "warning", title: "No single merge function" } }}
No function merges defaults, file, environment and runtime overrides into one object. <code>@netscript/config</code> validates and loads the project config, environment coercion is explicit through <code>resolveEnv</code> / <code>getEnv</code>, and <code>@netscript/runtime-config</code> is a separate layer your code reads with <code>loadRuntimeConfig</code> and applies per id. A runtime override file never changes your <code>NetScriptConfig</code> by itself; you read and apply the override explicitly.
{{ /comp }}

Typed environment reads look like this:

```ts
// src/env.ts
import { getEnv, resolveEnv } from '@netscript/config';

const port = getEnv('PORT', { type: 'number', default: 3000 }); // note: your scaffold's ports will differ

const env = resolveEnv({
  DATABASE_URL: { env: 'DB_URL', required: true },
  DEBUG: { type: 'boolean', default: false },
});
```

{{ comp.apiTable({
  caption: "@netscript/config — primary functions",
  rows: [
    { kind: "function", name: "defineConfig(input)", type: "(NetScriptConfigInput) => NetScriptConfig", desc: "Type-safe, validated config definition for netscript.config.ts. The 80% path." },
    { kind: "function", name: "defineConfigAsync(fn)", type: "((env: ConfigEnv) => …) => () => Promise<NetScriptConfig>", desc: "Async/env-aware config when the shape depends on { mode, command }." },
    { kind: "function", name: "loadConfig(options?)", type: "(LoadConfigOptions?) => Promise<NetScriptConfig>", desc: "Find, import, and validate the config file. Options: { cwd?, configFile? }." },
    { kind: "function", name: "initConfig(options?)", type: "(LoadConfigOptions?) => Promise<NetScriptConfig>", desc: "Load once and cache; call at startup. Then read synchronously via getConfig()." },
    { kind: "function", name: "getConfig()", type: "() => NetScriptConfig", desc: "Synchronous access to the cached config; throws if initConfig() has not run." },
    { kind: "function", name: "isConfigLoaded() / clearConfigCache()", type: "() => boolean / () => void", desc: "Inspect or reset the config cache. Use clearConfigCache() to force a reload between test cases." },
    { kind: "function", name: "resolveEnv(schema) / getEnv(name, opts?)", type: "typed env readers", desc: "Coerce env vars (string|number|boolean|json) with defaults; getEnv reads one variable." },
    { kind: "function", name: "getMode() / isDev() / isProd() / isTest() / hasEnv(name)", type: "env helpers", desc: "Current mode (DENO_ENV/NODE_ENV) and presence checks." },
    { kind: "function", name: "discoverWorkspace(root?) / findWorkspaceRoot(dir) / findMember(ws, name)", type: "workspace", desc: "Classify and locate Deno workspace members." },
    { kind: "function", name: "inspectConfig(target)", type: "(Partial<NetScriptConfig> | string) => InspectionReport", desc: "JSON-stable diagnostic report for CLI rendering." }
  ]
}) }}

{{ comp.apiTable({
  caption: "@netscript/runtime-config — primary functions",
  rows: [
    { kind: "function", name: "loadRuntimeConfig()", type: "() => Promise<RuntimeConfig>", desc: "Load overrides from the runtime dir via the 'current' pointer; empty defaults when files are missing." },
    { kind: "function", name: "watchRuntimeConfig(onChange, opts?)", type: "(cb, { signal?, prefix? }) => void", desc: "Watch the runtime config files and invoke onChange after debounced reloads." },
    { kind: "function", name: "isFeatureEnabled(config, flagId, defaultValue)", type: "(RuntimeConfig, string, boolean) => boolean", desc: "Read a feature flag, falling back when the flag is absent." },
    { kind: "function", name: "getJobOverride / getSagaOverride / getTriggerOverride", type: "(RuntimeConfig, id) => …Override | undefined", desc: "Look up a single override by id." },
    { kind: "function", name: "getRuntimeTask(config, taskId)", type: "(RuntimeConfig, string) => RuntimeTask | undefined", desc: "Get a runtime task definition by id." },
    { kind: "function", name: "summarizeRuntimeConfig(config, prefix?)", type: "(RuntimeConfig, string?) => RuntimeConfigSummary", desc: "Structured summary of active overrides (disabled jobs/sagas/triggers/features, message lines) for caller-owned presentation." },
    { kind: "const", name: "RUNTIME_CONFIG_TOPICS", type: "('jobs'|'sagas'|'triggers'|'features'|'tasks')[]", desc: "The topic names backed by versioned JSON files." }
  ]
}) }}

## Runtime override layout

The runtime override directory is resolved from the environment, then read through the `current`
pointer that names the active version of each topic file.

{{ comp.fileTree({ tree: {
  name: "runtime",
  comment: "NETSCRIPT_RUNTIME_CONFIG_DIR (else NETSCRIPT_TASKS_DIR's parent, else ./runtime)",
  children: [
    { name: "current", comment: "version pointer — JSON { version, jobs, sagas, … } or plain 'x.y.z'" },
    { name: "features", children: [ { name: "v1.0.0.json", comment: "FeatureFlag[]" } ] },
    { name: "jobs", children: [ { name: "v1.0.0.json", comment: "JobOverride[]" } ] },
    { name: "sagas", children: [ { name: "v1.0.0.json", comment: "SagaOverride[]" } ] },
    { name: "triggers", children: [ { name: "v1.0.0.json", comment: "TriggerOverride[]" } ] },
    { name: "tasks", children: [ { name: "v1.0.0.json", comment: "RuntimeTask[]" } ] }
  ]
} }) }}

{{ comp callout { type: "warning", title: "A wrong directory reads empty overrides" } }}
A missing directory, pointer or topic file is not an error: <code>loadRuntimeConfig</code> returns empty defaults so startup proceeds while operators roll overrides out independently. Make sure your deployment sets <code>NETSCRIPT_RUNTIME_CONFIG_DIR</code> (or the working directory) you expect, or the process silently reads no overrides.
{{ /comp }}

Read a flag at startup:

```ts
// src/feature-gate.ts
import { isFeatureEnabled, loadRuntimeConfig } from '@netscript/runtime-config';

const runtime = await loadRuntimeConfig();

// Third arg is the fallback when the flag file/entry is absent.
if (isFeatureEnabled(runtime, 'worker-rollout', false)) {
  // run the gated path
}
```

## Next steps

To publish, watch and roll back overrides in a running deployment, follow
[Roll out runtime overrides](/orchestration-runtime/how-to/roll-out-runtime-overrides/). For every
symbol, see the generated [`@netscript/config`](/reference/config/) and
[`@netscript/runtime-config`](/reference/runtime-config/) references.
