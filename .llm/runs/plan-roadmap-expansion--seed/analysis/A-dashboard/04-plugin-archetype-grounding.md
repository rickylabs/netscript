# 04 — Plugin archetype grounding for `plugins/dashboard` + `packages/plugin-dashboard-core`

Stage-B research task 5. Scope: reference-archetype reading of two existing plugins, the base
contract/service seam, ARCHETYPE-5 doctrine, and the CLI plugin-install mechanics — ending in a
folders-only SKETCH for the later Opus deep-dive. Not a locked design.

## 1. Two reference archetypes

### 1a. `plugins/workers` — heavy background-processor archetype

Files read in full: `plugins/workers/mod.ts`, `src/adapter/plugin.ts`, `src/public/mod.ts`,
`src/adapter/resources/mod.ts`, `contracts/v1/mod.ts`, `scaffold.ts`, `scaffold.plugin.json`,
`deno.json`, `README.md`, plus the sibling `packages/plugin-workers-core` tree.

- `mod.ts` is a one-line re-export: `export { workersPlugin } from './src/public/mod.ts';` —
  doctrine's "small mod.ts" rule in practice.
- `src/public/mod.ts` is the manifest: a `definePlugin('@netscript/plugin-workers', VERSION)`
  fluent chain contributing on essentially every axis — `.withType('background-processor')`,
  `.withPermissions(...)`, `.withDependencies({ streams: streamsPlugin })`, `.withService(...)`
  (one HTTP service, port 8091), three `.withBackgroundProcessor(...)` calls (combined/worker/
  scheduler entrypoints), `.withStreamTopics(...)` (3 topics: jobs/tasks/workflows, each backed by
  a Standard-Schema-typed `defineStreamTopic`), `.withDbSchemas([{ path: './database/workers.prisma',
  engine: 'postgres' }])`, `.withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])`,
  `.withRuntimeConfigTopics(...)`, `.withE2e(...)`, `.withAspire('./src/aspire/mod.ts')`,
  `.withHooks({ setup, beforeGenerate, afterGenerate, teardown })`, `.withMetadata(...)`, `.build()`.
- `contracts/v1/mod.ts` **re-exports** contract/runtime types from `@netscript/plugin-workers-core`
  — it does not redefine anything locally. This is the doctrine "re-export sibling contracts, don't
  redefine" rule observed as a real, not aspirational, pattern.
- `src/adapter/plugin.ts` is the separate adapter-layer object (`workersAdapterPlugin:
  NetScriptPlugin`) consumed by `@netscript/plugin/adapter`'s scaffold CLI: `install`
  (dependencySpecifier, starterResources, configParams, wiringEntry), `doctor` (healthEndpoint,
  requiredConfigKeys), `info`, `update`/`remove` strategies, and a `resources` array
  (`jobResource`/`taskResource`/`workflowResource`) — the mechanism `plugin add` uses to emit
  **typesafe generated userland glue** (barrel/runtime-glue/resource scaffolders in
  `src/adapter/resources/mod.ts`), not string-template copies.
- `scaffold.plugin.json`: `provider.kind: 'worker'`, `category: 'background-processor'`,
  `portRangeKey: 'INFRA_PLUGIN'`, `defaultRequiresDb/Kv: true`, `supportsConcurrency: true`,
  `officialSource.canonicalName: 'workers'`, `officialSource.dependencies: ['streams']`.
- `packages/plugin-workers-core` is large: `src/{abstracts,builders,config,contracts/v1,domain,
  executor(+8 runtime adapters),ports,presets,public,registry,runtime,shutdown,state,stores,
  streams,telemetry,testing,workflow}` plus active contract-soundness tests
  (`tests/contracts/workers-contract-{base-seam,soundness}_test.ts`).
- README states the marketplace-JSR install rule verbatim: **"`plugin add` resolves
  `@netscript/plugin-workers` from JSR and runs the plugin's own scaffolder — the plugin owns its
  setup, so the CLI ships no embedded templates."**

### 1b. `plugins/streams` — thin utility archetype (closer analog for dashboard)

`streams` has no background processors, no db schema, no contract versions, no runtime-config
topics — `src/public/mod.ts` is `definePlugin('@netscript/plugin-streams', ...).withType('utility')`
plus a single service and telemetry contribution. `scaffold.plugin.json`: `provider.kind: 'stream'`,
`category: 'plugin'`, `portRangeKey: 'PLUGIN_API'`, `defaultRequiresDb/Kv: false`, no concurrency.
The paired `packages/plugin-streams-core` is correspondingly small:
`src/{application,builders,diagnostics,domain,ports,public,telemetry,testing}` — no executor/
workflow/state/stores layers.

**Implication for dashboard:** a dashboard plugin is a read/aggregation/UI-serving surface, not a
background-job runner. `streams` (and `plugin-streams-core`'s proportionally small core-package
shape) is the closer starting analog than `workers`, though dashboard will still need its own
`.withService(...)` (to serve the Fresh build-console UI + any API routes) and likely
`.withAspire(...)` (for the Aspire dashboard-extension seam per topic spec §5/§6) — axes streams
does contribute.

## 2. Base contract/service seam (`packages/plugin`)

- `packages/plugin/README.md` — the base-package overview: `definePlugin` builder, the full
  contribution vocabulary (service, background-processor, stream-topics, db-schemas,
  contract-versions, runtime-config-topics, e2e, aspire, hooks, metadata, dependencies,
  permissions, tags), `inspectPlugin` diagnostics, subpath surfaces.
- `packages/plugin/src/contract-base/domain/base-contract.ts` (read in full, 123 lines) — **every
  plugin contract must satisfy `BasePluginContract`**:
  ```ts
  export interface BasePluginContract {
    readonly describe: BasePluginDescribeProcedure;
    readonly [route: string]: AnyContractRouter;
  }
  export const BASE_PLUGIN_CONTRACT_ROUTES = Object.freeze({
    describe: oc.errors({ ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0])
      .route({ method: 'GET', path: '/describe' })
      .output(PluginCapabilitiesSchema),
  });
  ```
  `BasePluginDescribeProcedure` is a real oRPC `ContractProcedure<any, Schema<unknown,
  PluginCapabilities>, ErrorMap, Meta>` — a genuinely-typed seam, not a phantom type. This appears
  to be the already-fixed/sound version of the seam referenced in the
  `plugin-service-type-unsoundness` and `plugin-contract-service-base-seam` doctrine memories — a
  positive data point for dashboard, not a verdict on the whole plugin surface.
- `packages/plugin/src/templates/skeleton/` (the `plugin new` scaffold, read in full) shows the
  **true minimal starting shape**: bare `definePlugin(...).withDescription(...).withLicense('MIT')
  .withAuthor(...).withE2e([...]).build()`; exports map limited to `.`, `./cli`, `./scaffolding`,
  `./e2e`, `./aspire`, `./testing` (no `./contracts`/`./services`/`./streams` until those axes are
  actually added); trivial placeholder classes for CLI/Aspire contribution/scaffolding. A fresh
  `plugins/dashboard` would start here, then add contribution axes incrementally — it does not need
  workers' full axis set from day one.

## 3. ARCHETYPE-5 (Plugin Package) doctrine + harness reconciliation

- `docs/architecture/doctrine/06-archetypes.md` ("Archetype 5 — Plugin Package", ~lines 157-190)
  states the canonical minimum shape: `mod.ts`, `README.md`, `deno.json`, `contracts.ts`, `src/
  {services,database,jobs|sagas|triggers,streams,verify-plugin.ts}`, `tests/`. Doctrine bullets:
  re-export don't redefine; plain `*.prisma` schema files; explicit named service/background
  exports; `verify-plugin.ts` required; small `mod.ts`.
- `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` (read in full, 155 lines) states the **real
  observed layout differs and is authoritative pending reconciliation**: contribution folders
  (`contracts/`, `services/`, `database/`, `jobs/`, `streams/`) sit as **top-level siblings of
  `src/`**, not nested inside `src/` — matching what `workers`/`streams` actually look like on disk.
  This discrepancy is tracked under issues **#305/#306** (doctrine-revamp lane) and is explicitly
  **not** something this research task should settle.
- The harness file's central "thinness law" (verbatim in spirit): convention-bearing primitives
  live in `@netscript/*` core; a `plugins/*` package is thin userland glue that wires/composes
  core-owned primitives and re-exports sibling contracts — it must **never** redefine contracts,
  re-implement a core convention, or own what core should own. "Fat plugin owning what core should
  own" is flagged as the single highest-value anti-pattern to catch in review. This directly gates
  a dashboard design: any dashboard-specific domain logic (panel data models, Aspire-resource
  query logic, telemetry aggregation) belongs in `packages/plugin-dashboard-core`, not in
  `plugins/dashboard`.

## 4. CLI wiring — what `plugin add dashboard` concretely requires

Read in full: `packages/cli/src/public/features/plugins/install/install-plugin.ts`,
`plan-plugin-install.ts`, `packages/cli/src/maintainer/adapters/official-plugin-source.ts`, plus
`.agents/skills/netscript-cli/commands.md` (lines 95-185) and the alias table in
`plugin-package-resolver.ts`.

- There are **two distinct install paths**, and they matter for what dashboard needs to ship:
  1. **Public JSR-resolved path** (`packages/cli/src/public/features/plugins/install/`) — generic,
     works for any published plugin. `resolvePluginDescriptorBeforePlanning()` in
     `install-plugin.ts` detects a JSR spec / `@`-prefixed package name / bare alias
     (`BARE_PLUGIN_PACKAGE_ALIASES`, e.g. `worker`/`workers` → `@netscript/plugin-workers`),
     resolves the package, reads its own `scaffold.plugin.json`, and **dynamically registers the
     provider `kind`** into the CLI's `PluginKindRegistry` at install time — then dispatches the
     plugin's own scaffolder. **This means a brand-new plugin `kind` (e.g. `"dashboard"`) does NOT
     require a CLI code change to become installable** via `netscript plugin install
     @netscript/plugin-dashboard` or a `jsr:` spec — it only needs its own valid
     `scaffold.plugin.json` with `provider.kind: 'dashboard'`, exactly like workers/streams already
     do. Whether dashboard *additionally* earns a fifth first-class `--kind dashboard` /
     `BARE_PLUGIN_PACKAGE_ALIASES` shortcut string (alongside worker/saga/trigger/stream) is a
     separate, later, low-cost design choice — not a hard requirement to ship.
  2. **Maintainer/local-source "official plugin copy" path**
     (`packages/cli/src/maintainer/adapters/official-plugin-source.ts`) — reads each first-party
     `plugins/*/scaffold.plugin.json`'s `officialSource` block (canonicalName, pluginDir,
     serviceEntrypoint, servicePort, dependencies, etc.) to copy plugin SOURCE directly from this
     monorepo checkout, for local dev/E2E only. Dashboard would need an `officialSource` block in
     its own `scaffold.plugin.json` purely to participate in the repo's own
     `scaffold.runtime`/`scaffold.plugins` E2E suites (see `AGENTS.md` E2E section) alongside
     workers/sagas/triggers/streams — this is a repo-internal dev/test concern, separate from the
     public JSR install story.
  3. `plan-plugin-install.ts`'s `parsePluginKind()` throws `Unsupported plugin kind "X"` only for
     the fixed local-alias fallback branch (no JSR spec, no dynamic registration) — irrelevant to
     dashboard once it ships via JSR.
  4. Post-scaffold, `installPlugin()` runs common workspace wiring regardless of path:
     `copyPluginSchemasToRootDb`, `workspaceMutator.updateAppsettings/
     ensureNetScriptConfigPlugin/ensureRootImportsForPluginKind/ensureSharedCache/
     ensureWorkspaceMember`, `regenerateAspireHelpers` — dashboard gets these for free once its
     manifest/scaffold.plugin.json are correct; no special-casing needed in the installer itself.

**Bottom line for topic A's D2 ratified decision ("ships as a PLUGIN, `plugin add dashboard`"):**
this is architecturally cheap. The generic JSR-install path already supports arbitrary new kinds;
dashboard needs (a) a `scaffold.plugin.json` with `provider.kind: 'dashboard'` and appropriate
`category`/`portRangeKey`/`defaultRequiresDb`/`defaultRequiresKv` flags, (b) its own scaffold
entrypoint (`scaffold.ts` wrapping `createPluginAdapter(dashboardAdapterPlugin).toScaffold()`, per
the workers pattern), and (c) — if it is to participate in the repo's own `scaffold.runtime` E2E
suite alongside workers/sagas/triggers/streams — an `officialSource` block. No `PluginKindRegistry`
or installer core code changes are required.

## 5. SKETCH — folders-only, NOT a locked design

This is a starting point for the later Opus deep-dive agent, modeled on the `streams` thin-utility
shape (§1b) plus the axes dashboard clearly needs (service + Aspire), reconciled against the
harness-authoritative top-level-sibling-folders layout (§3) rather than the doctrine-text nested
layout, pending #305/#306.

```
plugins/dashboard/
  mod.ts                        # one-line re-export, per doctrine
  README.md
  deno.json
  scaffold.ts                   # createPluginAdapter(dashboardAdapterPlugin).toScaffold()
  scaffold.plugin.json          # provider.kind: 'dashboard', category: 'plugin' (TBD), officialSource
  contracts/
    v1/mod.ts                   # re-export from packages/plugin-dashboard-core, no redefinition
  services/
    src/main.ts                 # serves the Fresh build-console UI + any dashboard API routes
  src/
    public/mod.ts                # definePlugin('@netscript/plugin-dashboard', VERSION)...build()
    adapter/
      plugin.ts                  # NetScriptPlugin adapter object (install/doctor/info/update/remove)
      resources/mod.ts            # starter-resource scaffolders (typesafe codegen, per #157 mandate)
    aspire/mod.ts                # Aspire dashboard-extension contribution (WithCommand seam — see 05)
  tests/

packages/plugin-dashboard-core/
  src/
    application/                 # panel/query orchestration (data-fetch use cases)
    domain/                      # dashboard panel/data-source models
    ports/                       # e.g. AspireResourcePort, TelemetryQueryPort (Topic B convergence)
    public/                      # package's own public surface
    telemetry/                   # dashboard's own instrumentation of itself, per flagship-quality bar
    testing/
  tests/
    contracts/dashboard-contract-base-seam_test.ts   # soundness test, mirroring workers-core
```

Open items deliberately left to the Opus deep-dive, not resolved here: whether dashboard needs a
`background-processor` axis at all (unlikely — it is a UI/read surface, not a job runner); how
D-NSONE (fresh-ui vs promoted "NS One" design system) affects the `services/`/UI-serving shape;
exact `provider.category`/`portRangeKey` values; and the concrete `.withAspire(...)` contribution
content (depends on the parallel "Aspire dashboard-extension surface research" agent's findings).
