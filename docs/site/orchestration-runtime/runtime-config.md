---
layout: layouts/base.vto
title: Runtime configuration
templateEngine: [vento, md]
prev: { label: "Polyglot tasks", href: "/background-processing/polyglot-tasks/" }
next: { label: "Capabilities", href: "/capabilities/" }
---

# Runtime configuration

NetScript splits configuration into two layers: a **typed project config** you author
once in `netscript.config.ts` and load at startup (`@netscript/config`), and a
**hot-reloadable runtime override layer** that operators roll out without redeploying
(`@netscript/runtime-config`). Together they give you one validated, type-safe view of how
the app is wired — defaults baked into the schema, values pulled from a config file and the
environment, and last-mile operational overrides applied at runtime.

{{ comp.diagram({ src: "/assets/diagrams/runtime-config-resolution.svg", alt: "Configuration resolution chain: schema defaults flow into the loaded config file, environment variables override typed values via resolveEnv, and hot-reloadable runtime override files apply last to produce a frozen resolved config.", caption: "Resolution chain — schema defaults → config file (defineConfig / loadConfig) → environment (resolveEnv / getEnv) → runtime override files (loadRuntimeConfig) → the validated config the framework reads." }) }}

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for <strong>project config</strong> (<code>@netscript/config</code>) when you need to
declare <em>how the app is built and wired</em> — services, ports, databases, plugins,
paths — once, with full TypeScript inference and Zod validation. Reach for
<strong>runtime overrides</strong> (<code>@netscript/runtime-config</code>) when an
<em>operator</em> needs to toggle a feature flag, disable a job/saga/trigger, or add a task
<strong>without a redeploy</strong>. For one-off typed reads of a single environment
variable, use <a href="/orchestration-runtime/runtime-config/"><code>getEnv</code></a>. See also
<a href="/explanation/architecture/">architecture</a>.
{{ /comp }}

## What it is

Project config is the **static, schema-validated topology** of a NetScript app. You author
it with `defineConfig` (or `defineConfigAsync` when the shape depends on mode/command),
NetScript validates it against a Zod schema, and `loadConfig` / `initConfig` resolve the
authored file into a fully typed `NetScriptConfig`. Environment variables feed into this
layer through `resolveEnv` / `getEnv`, which coerce and default typed values per call.

Runtime config is a **separate, dynamic override layer**. It lives under a `runtime/`
directory of versioned JSON files (jobs, sagas, triggers, features, tasks) selected by a
`current` version pointer. `loadRuntimeConfig` reads it into a `RuntimeConfig` snapshot;
`watchRuntimeConfig` reloads on change. Missing files produce **empty defaults** so startup
never blocks on overrides that have not been rolled out yet. The two packages are
deliberately distinct: `@netscript/config` owns the build-time contract, and
`@netscript/runtime-config` owns the hot-reloadable operational layer.

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Architecture",
    body: "How project config, the workspace layout, and the plugin system fit together at startup.",
    href: "/explanation/architecture/",
    icon: "◎"
  },
  {
    title: "Do — Choose a queue provider",
    body: "A config-driven decision recipe: pick and wire a queue backend through project config.",
    href: "/how-to/choose-a-queue-provider/",
    icon: "◆"
  }
] }) }}

## Minimal example

Author the project config once, then load and inspect it at startup. The `runtimeConfig`
section of the project config controls where the **generated** runtime schema/output lives —
`netscript generate runtime-schemas` derives those schemas from registered plugin metadata
(see [CLI & scaffold](/orchestration-runtime/cli-scaffold/)); the live overrides are read
separately by `@netscript/runtime-config`.

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
    api: { port: 3000 },
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

## Key types first

The project config you author is `NetScriptConfigInput`; what `loadConfig` / `initConfig`
return is the fully validated `NetScriptConfig`. These are the load-bearing fields.

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

The runtime override snapshot is a separate type — `RuntimeConfig` — returned by
`loadRuntimeConfig()`. Each field is an array loaded from one topic directory.

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

There is no single monolithic merge function — resolution happens across the two packages,
each with its own precedence. The order below is the conceptual chain the diagram depicts.

{{ comp.apiTable({
  caption: "How a value is resolved (lowest precedence first)",
  rows: [
    { name: "1. Schema defaults", type: "@netscript/config", desc: "Zod schema fills omitted fields when defineConfig validates the authored input into NetScriptConfig." },
    { name: "2. Config file", type: "loadConfig / initConfig", desc: "File search order: options.configFile → netscript.config.ts → .js → .mjs. cwd resolves from options.cwd → NETSCRIPT_PROJECT_ROOT → Deno.cwd()." },
    { name: "3. Environment", type: "resolveEnv / getEnv", desc: "Per-variable: read the env var (def.env overrides the name) and coerce by type (string|number|boolean|json); if absent, use default; if required and absent with no default, throw." },
    { name: "4. Runtime overrides", type: "loadRuntimeConfig", desc: "Hot-reloadable JSON under the runtime dir, keyed by the 'current' version pointer; applied per-id (job/saga/trigger/feature/task). Missing files → empty defaults." }
  ]
}) }}

{{ comp.apiTable({
  caption: "@netscript/config — primary functions",
  rows: [
    { name: "defineConfig(input)", type: "(NetScriptConfigInput) => NetScriptConfig", desc: "Type-safe, validated config definition for netscript.config.ts. The 80% path." },
    { name: "defineConfigAsync(fn)", type: "((env: ConfigEnv) => …) => () => Promise<NetScriptConfig>", desc: "Async/env-aware config when the shape depends on { mode, command }." },
    { name: "loadConfig(options?)", type: "(LoadConfigOptions?) => Promise<NetScriptConfig>", desc: "Find, import, and validate the config file. Options: { cwd?, configFile? }." },
    { name: "initConfig(options?)", type: "(LoadConfigOptions?) => Promise<NetScriptConfig>", desc: "Load once and cache; call at startup. Then read synchronously via getConfig()." },
    { name: "getConfig()", type: "() => NetScriptConfig", desc: "Synchronous access to the cached config; throws if initConfig() has not run." },
    { name: "isConfigLoaded() / clearConfigCache()", type: "() => boolean / () => void", desc: "Inspect or reset the config cache (clearConfigCache is for tests/reload)." },
    { name: "resolveEnv(schema) / getEnv(name, opts?)", type: "typed env readers", desc: "Coerce env vars (string|number|boolean|json) with defaults; getEnv reads one variable." },
    { name: "getMode() / isDev() / isProd() / isTest() / hasEnv(name)", type: "env helpers", desc: "Current mode (DENO_ENV/NODE_ENV) and presence checks." },
    { name: "discoverWorkspace(root?) / findWorkspaceRoot(dir) / findMember(ws, name)", type: "workspace", desc: "Classify and locate Deno workspace members." },
    { name: "inspectConfig(target)", type: "(Partial<NetScriptConfig> | string) => InspectionReport", desc: "JSON-stable diagnostic report for CLI rendering." }
  ]
}) }}

{{ comp.apiTable({
  caption: "@netscript/runtime-config — primary functions",
  rows: [
    { name: "loadRuntimeConfig()", type: "() => Promise<RuntimeConfig>", desc: "Load overrides from the runtime dir via the 'current' pointer; empty defaults when files are missing." },
    { name: "watchRuntimeConfig(onChange, opts?)", type: "(cb, { signal?, prefix? }) => void", desc: "Watch the runtime config files and invoke onChange after debounced reloads." },
    { name: "isFeatureEnabled(config, flagId, defaultValue)", type: "(RuntimeConfig, string, boolean) => boolean", desc: "Read a feature flag, falling back when the flag is absent." },
    { name: "getJobOverride / getSagaOverride / getTriggerOverride", type: "(RuntimeConfig, id) => …Override | undefined", desc: "Look up a single override by id." },
    { name: "getRuntimeTask(config, taskId)", type: "(RuntimeConfig, string) => RuntimeTask | undefined", desc: "Get a runtime task definition by id." },
    { name: "summarizeRuntimeConfig(config, prefix?)", type: "(RuntimeConfig, string?) => RuntimeConfigSummary", desc: "Structured summary of active overrides (disabled jobs/sagas/triggers/features, message lines) for caller-owned presentation." },
    { name: "RUNTIME_CONFIG_TOPICS", type: "('jobs'|'sagas'|'triggers'|'features'|'tasks')[]", desc: "The topic names backed by versioned JSON files." }
  ]
}) }}

## Runtime override layout

The runtime override directory is resolved from the environment, then read through the
`current` pointer that names the active version of each topic file.

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

{{ comp.tabbedCode({ tabs: [
  {
    label: "Read a feature flag at startup",
    lang: "ts",
    code: "// src/feature-gate.ts\nimport { isFeatureEnabled, loadRuntimeConfig } from '@netscript/runtime-config';\n\nconst runtime = await loadRuntimeConfig();\n\n// Third arg is the fallback when the flag file/entry is absent.\nif (isFeatureEnabled(runtime, 'worker-rollout', false)) {\n  // run the gated path\n}"
  },
  {
    label: "Hot-reload on change",
    lang: "ts",
    code: "// src/runtime-watch.ts\nimport { summarizeRuntimeConfig, watchRuntimeConfig } from '@netscript/runtime-config';\n\nconst controller = new AbortController();\n\nwatchRuntimeConfig(async (config) => {\n  const summary = summarizeRuntimeConfig(config);\n  // re-apply overrides; summary.messages is presentation-ready\n  console.log(summary.messages.join('\\n'));\n}, { signal: controller.signal });"
  },
  {
    label: "Typed env reads",
    lang: "ts",
    code: "// src/env.ts\nimport { getEnv, resolveEnv } from '@netscript/config';\n\nconst port = getEnv('PORT', { type: 'number', default: 3000 });\n\nconst env = resolveEnv({\n  DATABASE_URL: { env: 'DB_URL', required: true },\n  DEBUG: { type: 'boolean', default: false },\n});"
  }
] }) }}

## Production notes

{{ comp callout { type: "warning", title: "Two packages, two precedence rules — not one merge" } }}
There is <strong>no single function</strong> that merges defaults, file, env, and runtime
overrides into one object. <code>@netscript/config</code> validates and loads the
<em>project</em> config; per-variable env coercion is explicit via <code>resolveEnv</code> /
<code>getEnv</code>; and <code>@netscript/runtime-config</code> is a <em>separate</em>
hot-reloadable layer your code reads with <code>loadRuntimeConfig</code> and applies per id.
Don't expect a runtime override file to silently change your <code>NetScriptConfig</code> —
you read and apply the override explicitly.
{{ /comp }}

{{ comp callout { type: "important", title: "Runtime dir resolution & missing files" } }}
The runtime override directory is resolved as
<code>NETSCRIPT_RUNTIME_CONFIG_DIR</code> → else the parent of
<code>NETSCRIPT_TASKS_DIR</code> → else <code>./runtime</code>. A missing directory,
pointer, or topic file is <strong>not an error</strong> — <code>loadRuntimeConfig</code>
returns empty defaults so startup proceeds while operators roll overrides out
independently. Make sure your deployment sets the env var (or the working directory) you
expect, or you may silently read empty overrides.
{{ /comp }}

{{ comp callout { type: "note", title: "getConfig() must follow initConfig()" } }}
<code>getConfig()</code> returns the cached config and <strong>throws</strong> if
<code>initConfig()</code> has not run. Call <code>initConfig()</code> once at startup, then
read synchronously anywhere. In tests, use <code>clearConfigCache()</code> to force a
reload between cases.
{{ /comp }}

## Reference →

This hub is intentionally thin — the full generated API surface for both packages lives in
the reference.

{{ comp.xref({ key: "ref:runtime-config" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/runtime-config",
    body: "loadRuntimeConfig, watchRuntimeConfig, the override types, and the topic helpers.",
    href: "/reference/runtime-config/",
    icon: "≡"
  },
  {
    title: "Look up — @netscript/config",
    body: "defineConfig, loadConfig/initConfig, resolveEnv/getEnv, the NetScriptConfig schema, and workspace helpers.",
    href: "/reference/config/",
    icon: "≡"
  },
  {
    title: "Understand — Architecture",
    body: "Where project config, the workspace, and the plugin system sit in the framework.",
    href: "/explanation/architecture/",
    icon: "◎"
  },
  {
    title: "Browse — Capabilities",
    body: "All NetScript capabilities: services, jobs, sagas, triggers, database, and more.",
    href: "/capabilities/",
    icon: "◆"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Polyglot tasks", href: "/background-processing/polyglot-tasks/" }, next: { label: "Capabilities", href: "/capabilities/" } }) }}
