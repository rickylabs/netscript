# R1 — Plugin Architecture Seams for a NetScript Process-Manager Plugin

> Discovery corpus for `plan-process-manager--seed`. Citations are repo-relative paths against the
> worktree `C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager` unless marked external.
> Charter: `.llm/runs/plan-process-manager--seed/charter.md`.

## 1. Which archetype(s) apply

The process-manager plugin is **two composed archetypes at once**, and the charter's own framing
(§"Owner's framing (why a plugin)") makes both explicit:

- **Archetype 5 — Plugin Package** (`.llm/harness/archetypes/ARCHETYPE-5-plugin.md:1-154`) for the
  thin `plugins/process-manager` (or `plugins/process`) userland package — manifest, service
  entrypoints, Aspire contribution, CLI subcommand, verify-plugin.
- **Archetype 7 — Deployment Target Adapter** (`.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md:1-124`)
  for the bare-metal supervision core itself, because the charter's "final objective" is literally
  the archetype's trigger condition: *"a deployment feature deploys an app to multiple targets
  behind a port/adapter seam with a thin CLI router"* (`ARCHETYPE-7:29-34`). Archetype 7's own
  **Status** section (`ARCHETYPE-7:9-15`) says the deployment core "is not built yet — deploy today
  lives inside `packages/cli` (Archetype 6)" and names `#339` (systemd), `#340` (deno-deploy),
  `#342` (docker/compose), `#343` (aca) as the four adapter slices this archetype was seeded for.
  **A process-manager IS the missing 5th/6th adapter this archetype anticipates for bare metal** —
  it is not a new pattern, it is Archetype 7's bare-metal core finally getting built out to
  first-class scope instead of living as ad hoc CLI kernel code.

Because Archetype 7 **composes, not replaces**, Archetypes 2 (Integration — port/adapter core) and 6
(CLI/Tooling — thin router) (`ARCHETYPE-7:36-48`), the concrete shape is:

- a **package-owned `OsServicePort`** (already exists, see §3) plus target adapters, each an
  Archetype-2 integration,
- a **thin CLI router** (`netscript deploy <target> <verb>` today; `ARCHETYPE-7:42-44`) satisfying
  Archetype 6 gates,
- **and**, per the charter, a **plugin surface** (Archetype 5) that packages the whole thing as an
  optional, installable capability — i.e. the plugin *is* the distribution/composition-root
  mechanism for the Archetype-7 core, not a third parallel thing.

## 2. The thinness law, verbatim, and what it means here

`ARCHETYPE-5-plugin.md:3-10` states the law that gates this whole run:

> "Convention-bearing primitives — contracts, base services, schema/runtime conventions,
> event/kind vocabularies — live in `@netscript/*` **core**. A first-party `plugins/*` package is
> **thin userland glue**: it wires and composes core-owned primitives into a concrete integration
> and re-exports sibling contracts; it does not redefine contracts, re-implement a core convention,
> or own what core should own."

Applied to process-manager: **the supervision engine (spawn/monitor/restart/backoff/log-capture/
health-check state machine) is convention-bearing runtime behavior and must NOT live inside
`plugins/process-manager`.** It belongs in a fat core package (Archetype 2/3 hybrid — integration
+ runtime/state) analogous to `plugin-workers-core`, with the plugin as thin wiring exactly like
`plugins/workers` is to `plugin-workers-core`. The anti-pattern to avoid by name
(`ARCHETYPE-5-plugin.md:82-85`, `103-110`, `148-154`) is **"fat plugin owning what core should
own"** — the single highest-value review target the doctrine calls out for every Archetype-5
package, and it directly targets a supervision engine sitting in `plugins/` instead of a
`packages/*-core`.

## 3. What already exists — the bare-metal seams to reuse, not reinvent

All confirmed live in `packages/cli`, none in a dedicated deploy package yet (matches Archetype 7's
"future-wave" status):

- **`OsServicePort`** (`packages/cli/src/public/ports/os-service-port.ts:36-45`) — a 2-method,
  5-operation seam: `install(request)` and `run(operation, serviceName)` where `operation` is
  `'start'|'stop'|'status'|'uninstall'` (install is separate). This is **narrower** than Archetype
  7's 7-op uniform adapter contract (`plan/emit, up, down, status, logs, rollback, secrets`,
  `ARCHETYPE-7:56-63`) — `OsServicePort` is the low-level OS-service primitive one adapter op
  (`up`/`down`) is built from, not the full contract itself. A process-manager plugin's own
  "OS-native fallback" mode (installing itself as a systemd/servy unit) would consume this port
  directly rather than re-deriving OS-service registration.
- **Two adapters behind it**: `ServyOsServiceAdapter`
  (`packages/cli/src/public/adapters/servy-os-service.ts:30-63`, Windows, shells out to
  `servy-cli.exe` via a `ProcessPort`) and `systemd-os-service.ts` (Linux, 81 lines). Command
  argument construction is centralized in
  `packages/cli/src/kernel/adapters/deploy/commands/servy-command.ts` and
  `packages/cli/src/kernel/adapters/linux/systemd/systemd-command.ts` so port-driven and
  command-layer invocations stay byte-identical (adapter file header comment,
  `servy-os-service.ts:1-9`) — a convention a process-manager's own OS-service mode should copy, not
  fork.
- **`os-service-factory.ts`** (`packages/cli/src/public/adapters/os-service-factory.ts`, 44 lines) —
  selects the adapter by host OS. A process-manager plugin's bare-metal fallback would call the same
  factory rather than re-detecting the platform.
- **Deploy CLI commands already wired to this port**:
  `packages/cli/src/public/features/deploy/{install,start,status,stop,uninstall}` (install-service-
  deploy.ts, start-deploy-command.ts, status-deploy-command.ts, stop-deploy-command.ts, uninstall-
  service-deploy.ts). These are the existing thin-router commands the deploy epic's `netscript
  deploy` surface already exposes — a process-manager CLI (surface B of the charter) should extend
  this router, not stand up a parallel `netscript pm ...` command tree with duplicate service-
  lifecycle logic.
- **Windows Servy config generation**: `packages/cli/src/kernel/adapters/windows/servy/{servy-config,
  servy-environment,servy-writer,servy-xml}.ts` — XML unit generation already exists and is the
  concrete evidence for the charter's Servy research directive ("NetScript already ships a servy
  adapter in the CLI bare-metal lane").
- **Deploy domain types**: `packages/cli/src/kernel/domain/deploy/{activation-convention,compile-
  target, deno-deploy-cli-port, observability-convention, service-deploy-target, servy-config}.ts` —
  `observability-convention.ts` in particular is the existing seam name for the "OTEL/health-gate/
  secrets hardening" work the charter cites (#341); a process-manager plugin's own health-check loop
  should extend this convention rather than invent a second one.
- **`deno compile` artifact convention** (#340) and **rollback/health-gate/OTEL/secrets hardening**
  (#341) are cited in the charter as shipped (`charter.md:40`) but their concrete files were not
  re-verified in this pass (only `os-service-*`/`servy*`/`systemd*` greps were run) — **flag as an
  open item for a targeted follow-up read** rather than assumed from the charter text alone.

**Archetype-7 rule bindings that will gate any process-manager-as-deploy-target design**
(`ARCHETYPE-7-deploy-target-adapter.md:64-72`):
- R-DEPLOY-1: the process-manager (as a bare-metal target) implements the uniform 7-op contract or
  a declared subset (it plausibly needs `up/down/status/logs/rollback`, arguably not `secrets`
  itself — secrets stay centralized per R-DEPLOY-3).
- R-DEPLOY-2: no target-specific business logic leaks into the CLI router — `netscript deploy
  process-manager <verb>` and `netscript pm <verb>` (if it exists as its own surface) both stay thin.
- R-DEPLOY-3: health/OTEL/secrets/rollback stay centralized in the Archetype-7 **core**, shared
  across every target — the process-manager must not reimplement its own rollback/health-gate
  conventions.
- R-DEPLOY-4: any process-manager deploy-target config member spreads `DeployTargetBaseSchema`
  (`@netscript/config`), never a parallel config base class.
- R-DEPLOY-5: the port/adapter seam is only justified because ≥2 adapters are foreseeable — already
  true (servy + systemd existing, cloud adapters landed).

## 4. The reference composition pattern: `plugins/workers` + `plugin-workers-core`

Confirmed on-disk shape (`ls` against the worktree):

```
packages/plugin-workers-core/     # FAT — Archetype 2/3
  src/{abstracts,builders,config,contracts,domain,executor,ports,presets,
        public,registry,runtime,shutdown,state,stores,streams,telemetry,testing}/
  mod.ts   — re-exports defineJob/defineTask/defineWorkflow/cron/permissions/
             defineJobHandler/createWorkersRuntime/createFailureResult/
             createSuccessResult/startWorkers/inspectJob/inspectTask/inspectWorkflow
             (packages/plugin-workers-core/mod.ts:17-27)

plugins/workers/                  # THIN — Archetype 5
  bin/ contracts/ database/ jobs/ services/ src/ streams/ tests/ worker/
  src/{adapter,aspire,cli,e2e,public,runtime}/
  scaffold.plugin.json  scaffold.ts  cli.ts  mod.ts  verify-plugin.ts
```

`plugins/workers/scaffold.plugin.json` (full read, `plugins/workers/scaffold.plugin.json:1-71`) is
the concrete manifest template a process-manager plugin should near-copy:

```json
{
  "schemaVersion": 1,
  "name": "@netscript/plugin-workers",
  "version": "0.0.1-beta.5",
  "peerDependencies": { "@netscript/plugin": "0.0.1-beta.5" },
  "capabilities": { "hasDatabaseMigrations": true, "hasRoutes": true, "hasBackgroundWorkers": true },
  "scaffolder": { "export": "./scaffold", "requiredPermissions": { "net": [], "read": ["<workspaceRoot>"], "write": ["<workspaceRoot>"] } },
  "provider": {
    "kind": "worker", "displayName": "Background Worker", "category": "background-processor",
    "portRangeKey": "INFRA_PLUGIN",
    "defaultPermissions": ["--unstable-kv","--allow-net","--allow-env","--allow-read","--allow-write","--allow-run"],
    "watchFlag": "--watch", "defaultEntrypoint": "workers/runtime.ts",
    "defaultServiceEntrypoint": "services/src/main.ts",
    "defaultRequiresDb": true, "defaultRequiresKv": true,
    "pluginType": "background-processor", "supportsConcurrency": true,
    "concurrencyEnvVar": "WORKER_CONCURRENCY", "defaultConcurrency": 2,
    "defaultTelemetry": true, "infrastructureRequires": ["kv"], "infrastructureOptionalDeps": ["db"]
  },
  "officialSource": {
    "canonicalName": "workers", "pluginDir": "workers", "backgroundDir": "workers",
    "serviceEntrypoint": "services/src/main.ts", "backgroundEntrypoint": "workers/runtime.ts",
    "serviceConfigKey": "workers-api", "servicePort": 8091, "backgroundPort": 8091,
    "dependencies": ["streams"], "requiresDb": true, "requiresKv": true, "permissions": [ /* … */ ]
  }
}
```

A `plugins/process-manager/scaffold.plugin.json` would set `provider.kind: 'process-manager'`
(or `'pm'`), likely `category: 'infrastructure'` or a new category, `pluginType:
'background-processor'` (it IS one — it runs a long-lived supervisor loop), and — notably — it is
the one plugin whose `defaultRequiresDb/Kv` could plausibly be `false` at the base tier (process
state can live in-memory + an on-disk journal) unless a management UI needs durable history, which
would then argue for `defaultRequiresKv: true` via `@netscript/kv` (the plugin-thinness memory:
"KV via @netscript/kv" is how sibling plugins get durable state without owning a DB schema).

`plugin-workers-core` mirrors the `auth-core`+adapters split named as *the* reference shape in the
doctrine itself (`ARCHETYPE-5-plugin.md:8-9`, `154`): `packages/plugin-auth-core/src/` has the same
`config/contracts/domain/ports/presets/public/streams/telemetry/testing` shape, with three thin
adapter packages (`packages/auth-better-auth`, `packages/auth-kv-oauth`, `packages/auth-workos`)
each ~1-2 files (`packages/auth-better-auth/src/{better-auth,better-auth-backend}.ts`) wired by
`plugins/auth` (which itself mirrors `plugins/workers`'s top-level `contracts/database/services/src/
streams/tests` shape). **A process-manager could plausibly want the same adapter-fan-out** if it
supports multiple OS-service backends as swappable adapters (servy/systemd/launchd) behind one core
supervision port — this is the `auth-core`+adapters pattern, not the `workers` single-core pattern,
for the OS-integration layer specifically, while the higher-level supervision engine (process table,
restart policy, backoff, health checks) stays a single fat core like `plugin-workers-core`.

## 5. The plugin authoring contract (`@netscript/plugin`) — what a plugin gets for free

Read via `packages/plugin/mod.ts:1-107` (module doc + full export list) and
`packages/plugin/src/domain/mod.ts:1-27`, `packages/plugin/src/config/builders/plugin-builder.ts`
(class body read):

- **`definePlugin(name, version)` builder** (`PluginBuilder` class,
  `packages/plugin/src/config/builders/plugin-builder.ts:60-`) accumulates typed contributions via
  chained `.withX(...)` calls into an immutable `PluginBuilderState`, then `.build()`. Contribution
  axes available today (`packages/plugin/mod.ts:24-46`, cross-checked against
  `plugin-builder.ts` imports): `BackgroundProcessorContribution`, `ContractVersionContribution`,
  `DbSchemaContribution`, `E2eContribution`, `MigrationContribution`, `RuntimeConfigTopicContribution`,
  `ServiceContribution`, `StreamTopicContribution`, `TelemetryContribution`, plus `PluginDependencies`
  and `PluginLifecycleHooks`. **A process-manager plugin gets `.withBackgroundProcessor(...)` for
  free for its own supervisor daemon**, `.withService(...)` for an admin/CLI-facing API, and
  `.withTelemetry(...)` for OTEL wiring — no new contribution axis needs inventing (a smell the
  doctrine explicitly watches for, `A11`: "name extension axes before abstraction" — the process
  manager fits existing axes, so no new axis is justified).
- **`TelemetryContribution`** is a 2-field contract (`packages/plugin/src/config/domain/telemetry-
  contribution.ts:1-7`): `{ name: string; module: string }` — a pointer to an instrumentation module,
  not an implementation. The implementation lives in `@netscript/telemetry`
  (`packages/telemetry/mod.ts:1-73`): tracer/context/attributes/instrumentation/registry/orpc/otel/
  query/testing subpaths, plus root re-exports of `getTracer`, `withSpan`, W3C context propagation,
  and `initJobTracing`/`runTracedJob` (worker-specific helper already built for exactly this kind of
  long-running-process instrumentation, `packages/telemetry/mod.ts:46`). A process-manager's
  telemetry contribution is a thin pointer at a module that calls these — it does not reimplement
  span creation.
- **`PluginContext`** (`packages/plugin/src/domain/core-types.ts:31-42`, full interface read):
  `{ projectRoot, pluginRoot?, isDev?, logger: PluginLogger, manifest: unknown }`. This is
  deliberately minimal — **no direct DB/KV handle on the context itself**; DB/KV access is a
  contribution the plugin declares (`DbSchemaContribution`) and consumes through its own adapter
  layer (mirrors `plugin-thinness` memory: "KV via `@netscript/kv`"), not something injected
  ambiently. A process-manager plugin that wants durable process-table state imports
  `@netscript/kv` directly in its adapters layer, same as any sibling plugin.
- **`PluginContribution` abstract base + `ContributionAxis`** (`packages/plugin/src/abstracts/mod.ts`,
  re-exported `packages/plugin/mod.ts:49-50`) is the generic contribution-class seam; the
  Aspire-specific subclass (`AspireNSPluginContribution`, see §6) is the concrete pattern to mirror
  for any new contribution surface (e.g. `DashboardPanelContribution`, see §7) — **subclassing this
  abstract**, not inventing a parallel discovery mechanism (`ARCHETYPE-5:88-89`, AP-11: "plugin load
  side effects or implicit discovery magic" is the anti-pattern this seam exists to prevent).
- **Manifest protocol** (`packages/plugin/src/protocol/mod.ts`, re-exported
  `packages/plugin/mod.ts:87-106`): `PluginInstallerManifest`, `PluginManifestProvider`,
  `PluginManifestScaffolder`, `PluginScaffoldEntrypoint`, `ScaffolderContext`, `ScaffoldResult` —
  this is the typed contract `scaffold.plugin.json` + `scaffold.ts` conform to; `parsePluginManifest`
  + `PluginInstallerManifestSchema` (Standard-Schema-shaped) validate it at install time.
- **Diagnostics/verification** (`packages/plugin/mod.ts:51-86`): `inspectPlugin`, `verifyPlugin`,
  `runPluginVerificationCli`, `assertSuccessfulProbe`, `resolveProbeUrl` — this is the
  `verify-plugin.ts` machinery every plugin ships (Concept-of-Done requirement,
  `ARCHETYPE-5-plugin.md:142`); a process-manager plugin's `verify-plugin.ts` would probe its own
  admin-API health endpoint the same way `plugins/workers/verify-plugin.ts` does.

## 6. How a plugin ships background services + gets Aspire wiring for free

`plugins/workers/src/aspire/workers-contribution.ts` (full read of the contribution class) is the
concrete reference for "how plugins ship background services":

- `WorkersAspireContribution extends AspireNSPluginContribution` (imported from
  `@netscript/aspire/public`, re-exported through the plugin's own `aspire/mod.ts` barrel —
  `plugins/workers/src/aspire/mod.ts:1-17`, itself a re-export of `AspireBuilder`, `AspireResource`,
  `AspireResourceKind`, `ContributionContext`, `CacheSpec`, `ContainerSpec`, `DatabaseSpec`,
  `DenoBackgroundSpec`, `DenoServiceSpec`, `EnvSource`, `HealthCheckSpec` from core — **zero local
  redefinition**, exactly the thinness law in practice).
- `contribute(builder, ctx)` calls `builder.addDenoService('workers-api', {...})` for the HTTP-facing
  process and **three separate** `builder.addDenoBackground('workers-{combined,scheduler,worker}',
  {...})` calls for the actual background runtime processes — each with its own `workdir`,
  `entrypoint`, `permissions`, optional `concurrencyEnvVar`, `watchMode`
  (`workers-contribution.ts:56-89` as read).
- This is the load-bearing fact for the process-manager plugin's scope: **`addDenoService`/
  `addDenoBackground` are exactly the process-spawn primitives a process-manager would supervise in
  bare-metal (non-Aspire) mode.** In dev (`--no-aspire` per the charter's nice-to-have #4), Aspire
  itself is the process supervisor calling these; a process-manager plugin's dev-fallback mode is
  functionally "be a smaller, NetScript-native Aspire-orchestration substitute for exactly these
  same declared processes" — i.e. **the contribution list every plugin already declares via
  `AspireNSPluginContribution.contribute()` is the natural input to a process-manager's own registry**,
  not a new declaration surface the process-manager plugin invents. This is the strongest concrete
  "reuse seam" finding of this corpus: **the AspireResource[] a plugin returns from `contribute()`
  is potentially the SAME list a bare-metal process-manager supervises**, just executed by a
  different runtime (systemd/servy units, or the process-manager's own loop, instead of the Aspire
  AppHost).
- `AspireResourceKind` today is a **closed union**: `deno-service | deno-background | container |
  database | cache` (per the A-dashboard proposal's verified read, §8 below) — no `command`, no
  `app`. The dashboard epic (§7) is independently proposing to extend this same union with `command`
  and `app` kinds. **A process-manager plugin doing bare-metal supervision does not need new
  `AspireResourceKind` values** — it consumes the existing `deno-service`/`deno-background` shape;
  it is a *consumer* of this seam (like the dashboard's `AspireResourcePort`), not an extender of it,
  unless it also wants dashboard-triggerable lifecycle commands, in which case it inherits the
  dashboard epic's `command` kind rather than inventing a parallel command-invocation mechanism.

## 7. Reconciliation with the dashboard epic (#400 / DDX plan) — the admin console

The charter's Deno Desktop admin-console surface (A) is **not a green field** — a large, detailed,
already-locked design pack exists for a structurally similar "dev dashboard" epic, and the two must
be reconciled rather than built twice:

- Source: `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/{proposal.md,epic-and-issues.md,
  open-questions.md,agent-briefs.md}` (full read of `proposal.md` 1-579 and `epic-and-issues.md`
  1-358). This is the `epic:dev-dashboard` plan (23 issues, DDX-0…19), milestone `0.0.1-beta.6`
  (`epic-and-issues.md:9-21` — the milestone-authority banner; beta.6 = "dashboard DDX + telemetry
  T3–T8 + AI generative-UI/MCP" per the live train note).
- **Architecture is the direct precedent to copy**: thin `plugins/dashboard` (Archetype 5) + fat
  `packages/plugin-dashboard-core` (Archetype 2 integration core), explicitly modeled on the
  `streams`/`plugin-streams-core` analog (`proposal.md:9-11, 52-60`) because it is a read/
  aggregation/UI-serving surface with no owned DB schema — the same shape argument applies to a
  process-manager's **admin console specifically** (read/command surface over the supervision core),
  even though the process-manager's **core** itself is closer to `workers` (it owns real background
  runtime state, unlike dashboard/streams).
- **`DashboardPanelContribution` contract** (`proposal.md §9.2:521-549`, `epic-and-issues.md DDX-17:
  298-313`) is a **contribution-contract seam owned by `plugin-dashboard-core`**, discovered the same
  way `AspireNSPluginContribution` is discovered (a plugin depending on `plugin-dashboard-core`
  exports a contribution the registry-generation step collects), deliberately keeping
  `@netscript/plugin` itself dashboard-agnostic. **This is the exact mechanism a process-manager
  admin panel plugs into**: rather than building its own bespoke Deno Desktop UI framework, the
  process-manager plugin (or a thin `plugins/process-manager` dashboard-facing adapter) would author
  a `DashboardPanelContribution` — a "Plugin Control"-style per-capability section
  (`proposal.md §9.1:484-519`, `epic-and-issues.md DDX-18:315-324`) following the
  create→configure(tabs)→monitor loop already specified for workers/sagas/triggers/streams.
- **The charter's "Deno Desktop app... UI admin console"** is a *second, more literal* framing than
  the dashboard epic's "Fresh UI served over HTTP, launched by Aspire" framing (`proposal.md §2, §5`
  — the dashboard is a Fresh web app, not a Deno Desktop native app). **This is a real open
  reconciliation question, not a settled fact**: does the process-manager's admin console (A) become
  (a) a `DashboardPanelContribution` rendered *inside* the existing `epic:dev-dashboard` Fresh
  console (reuse-maximal, avoids a second UI shell), (b) a genuinely separate Deno Desktop native
  app that also happens to consume the same core ports (`TelemetryQueryPort`/`CommandInvokePort`
  equivalents), or (c) both — the dashboard gets a Plugin Control section for dev-time visibility,
  and a separate Deno Desktop app is the bare-metal *production* admin tool (no Aspire dependency in
  prod, which the dashboard architecture currently assumes — `proposal.md §4` ties the dashboard's
  data source to `Aspire /api/telemetry/*`, an Aspire-coupled, dev-only surface). Given the charter
  frames the Deno Desktop app as "the same underlying core mechanism as B [CLI]" and Deno Desktop is
  explicitly new in Deno 2.9.0 (charter.md:27) — i.e. it is NOT the Aspire-hosted Fresh dashboard —
  **option (b)/(c) reads as the more consistent charter intent**: the process-manager ships its own
  standalone Deno Desktop admin app (talks to the supervision core directly, works with or without
  Aspire/dashboard present), and *additionally* contributes a `DashboardPanelContribution` so it is
  visible inside the dev dashboard when both are installed. This should be posed as an explicit
  owner-fork at Stage E/H, not resolved unilaterally in this corpus.
- **`CommandInvokePort`** (`proposal.md:83-88`, domain/ports list in `plugin-dashboard-core`) is the
  dashboard core's port for triggering `withCommand` Aspire actions (restart/clear/migrate/seed) —
  this is conceptually the exact port shape a process-manager's own lifecycle actions
  (start/stop/restart/reload) would implement or extend, meaning **the dashboard epic and the
  process-manager epic are proposing structurally identical "invoke a lifecycle action on a
  supervised process" ports independently**. Whichever lands first should define the port that the
  other reuses; this is a concrete cross-epic edge to record (parallel to the dashboard epic's own
  recorded cross-epic edge with `#238` AI plugin, `epic-and-issues.md DDX-19:334-336`).
- **`command` + `app` `AspireResourceKind` extension (DDX-1)** (`proposal.md §2.2:186-221`,
  `epic-and-issues.md DDX-1:107-120`) is a `@netscript/aspire` core framework slice the dashboard epic
  needs for its own Aspire presence and for exposing lifecycle commands through Aspire. **A
  process-manager plugin that wants its restart/reload actions to also be reachable via `aspire
  resource <name> <cmd>` (dogfooding "one seam, three surfaces": UI + CLI + MCP, `proposal.md:200-
  204`) depends on this same DDX-1 slice** rather than inventing its own command-registration path.
  This is a second concrete shared-dependency edge to record for the DAG.

## 8. What the process-manager plugin inherits with zero code (built-ins)

Enumerated from the contribution axes (§5) and host mechanisms already covering every first-party
plugin:

1. **Manifest validation + install-time kind registration** — `parsePluginManifest` +
   `PluginInstallerManifestSchema` validate `scaffold.plugin.json`; the CLI installer dynamically
   registers a brand-new `provider.kind` (e.g. `'process-manager'`) into the kind registry at
   install time with **no CLI core change** — this exact confirmation was independently made for the
   dashboard's `'dashboard'` kind (`proposal.md §1.4:151-163`, citing
   `packages/cli/src/public/features/plugins/install/install-plugin.ts`) and the same installer code
   path (`packages/cli/src/public/features/plugins` — `install/`, `scaffold/`, `doctor/`, `list/`,
   `dispatch/`, `host/`, `info/`, `new/`, `remove/`, `update/` subfolders confirmed present) applies
   unmodified to a `process-manager` kind.
2. **Post-scaffold workspace wiring** — `copyPluginSchemasToRootDb`, `ensureNetScriptConfigPlugin`,
   `regenerateAspireHelpers` (named in `proposal.md:158-160`) run automatically for any installed
   plugin, process-manager included.
3. **Registry generation + plugin doctor** — `netscript generate plugins` and `netscript plugin
   doctor` (both confirmed live commands, `.agents/skills/netscript-cli/SKILL.md:96,100`) work over
   any installed plugin without plugin-specific doctor code, provided the manifest/verify-plugin
   contract is satisfied.
4. **OTEL instrumentation primitives** — `getTracer`/`withSpan`/W3C context propagation/
  `initJobTracing`/`runTracedJob` from `@netscript/telemetry` (§5) — a process-manager's supervisor
  loop is architecturally the same shape `initJobTracing`/`runTracedJob` were built for (a
  long-running worker process), so it is very likely a **direct reuse**, not just an analog.
5. **Aspire dev-mode process supervision "for free" today** — in dev, any `addDenoService`/
   `addDenoBackground` contribution is already supervised by Aspire (start/stop/restart/logs/health
   via the AppHost) with zero process-manager code; the charter's own framing (nice-to-have #4)
   concedes this ("in dev it runs like every other plugin — that is fine"). The process-manager's
   unique value is therefore concentrated in **bare-metal / non-Aspire production supervision**
   (surfaces A/B of the charter) and in providing a *NetScript-native, richer* alternative to raw
   systemd/servy units for teams that want process-level detail (restart policy, backoff, structured
   logs) without hand-authoring unit files — i.e. it is the "smart layer" between `OsServicePort`'s
   raw install/start/stop and a full Aspire AppHost.
6. **Contract-versioning + E2E gate contributions** — `ContractVersionContribution` and
   `E2eContribution` axes mean the process-manager's oRPC admin-API contract and its
   `scaffold.runtime`/`scaffold.plugins` E2E join (mirroring DDX-16's `dashboard` join,
   `epic-and-issues.md:283-292`) are declared, not hand-wired into the harness.
7. **Config surface** — `RuntimeConfigTopicContribution` gives the plugin a typed runtime-config
   topic (e.g. restart-policy defaults, max-restarts, backoff base) discoverable the same way every
   other plugin's runtime config is, without a bespoke config file format.

## 9. What `plugins/process(-manager)` + `packages/plugin-<x>-core` should look like

Given §1-8, the shape that best satisfies the thinness law and the Archetype-5/7 composition:

```
packages/process-manager-core/         # FAT — Archetype 2 (integration) + Archetype 3 (runtime/state)
  src/
    domain/        ProcessSpec, ProcessState, RestartPolicy, BackoffStrategy, HealthCheckSpec,
                    LogStream, ProcessGroup   (no impl imports; A8/A1)
    ports/          OsServicePort (REUSE existing packages/cli one — do not refork; see §10 open
                    question on package placement), ProcessSupervisorPort, LogSinkPort,
                    HealthCheckPort, CommandInvokePort-equivalent (align w/ dashboard's, §7)
    application/    superviseProcess(), restartWithBackoff(), evaluateHealthCheck(), reload(),
                    listProcesses(), streamLogs()   (domain + ports only)
    adapters/       os-native/ (spawns via Deno.Command; the actual supervisor loop for --no-aspire
                    dev fallback and bare-metal prod) · aspire-resource/ (reads the AspireResource[]
                    list a host's plugins already declared via contribute(), §6) · systemd/ · servy/
                    (thin wrappers delegating to the EXISTING packages/cli OsServicePort adapters —
                    not reimplementations)
    contracts/v1/   ProcessManagerContract extends BasePluginContract, oRPC procedures for
                    list/start/stop/restart/logs/health — mirrors DashboardContract's shape (§7)
    telemetry/ or middleware/  self-instrumentation via @netscript/telemetry (follow whichever role
                    name the #305/#306 doctrine-folder reconciliation lands on; dashboard core picked
                    `middleware/`, §7 citation — align, do not refork the folder-vocabulary question)
    testing/
  tests/contracts/process-manager-contract-base-seam_test.ts  (soundness test, mirrors workers-core)

plugins/process-manager/                # THIN — Archetype 5
  mod.ts  README.md  deno.json  cli.ts  verify-plugin.ts
  scaffold.ts            # createPluginAdapter(processManagerAdapterPlugin).toScaffold()
  scaffold.plugin.json    # provider.kind: 'process-manager', category: 'background-processor' (or
                          # new 'infrastructure' category — needs a design-pack decision),
                          # pluginType: 'background-processor', officialSource block
  contracts/v1/mod.ts     # re-export from core — no redefinition
  services/src/main.ts    # the admin/oRPC API service (surface for CLI B + future dashboard panel)
  src/
    public/mod.ts         # definePlugin(...).withType('background-processor')
                          #   .withBackgroundProcessor(...)   <- the supervisor daemon itself
                          #   .withService(...)               <- admin API
                          #   .withTelemetry(...)
                          #   .withAspire('./src/aspire/mod.ts')  <- for the --no-aspire fallback
                          #                                         AND dev-mode visibility
                          #   .withRuntimeConfigTopic(...)     <- restart-policy/backoff defaults
                          #   .build()
    adapter/plugin.ts     # NetScriptPlugin adapter (install/doctor/info/update/remove)
    aspire/mod.ts          # AspireNSPluginContribution subclass, IF the process-manager needs its
                          # own Aspire-visible resource(s) (its own admin API) — mirrors
                          # WorkersAspireContribution exactly
    dashboard/             # OPTIONAL: DashboardPanelContribution export (§7) — a "Plugin Control"
                          # style per-capability section, IF the epic:dev-dashboard reconciliation
                          # (§7 open question) resolves to "yes, contribute a panel"
    cli/                   # thin `netscript pm <verb>` OR extension of `netscript deploy
                          # process-manager <verb>` (Archetype 7 router) — resolve at Stage D/E
  tests/
```

Two structural decisions this corpus surfaces as **owner-forks, not resolved here**:
1. **Deploy-target vs. own-CLI-surface**: does the process-manager's CLI ride the Archetype-7
   `netscript deploy <target> <verb>` router (§1, §3) as one more target, or does it get its own
   `netscript pm ...` top-level command group (pm2-parity naming) that *also* satisfies Archetype 7
   underneath? The charter's "final objective" (§"Final objective") frames it as *the* bare-metal
   deployment target, arguing for the former; the pup/pm2 concept study argues for CLI-ergonomics
   parity with a dedicated verb set. Likely resolution: a dedicated `netscript pm` command group
   that is a thin Archetype-6 router **delegating to the same Archetype-7 core/port**, so both
   framings are true simultaneously — but this needs explicit design-pack treatment (Stage D).
2. **Core package boundary**: `process-manager-core` as ONE fat package (workers-core analog) vs.
   splitting the OS-adapter layer into its own `-core` with per-OS adapter packages (auth-core
   analog, §4) — this corpus recommends the workers-core-single-package shape as the default (the
   OS-service adapters are already thin single-file wrappers in `packages/cli`, not substantial
   enough to warrant the auth-style adapter-package fan-out), but flags it for Stage D confirmation.

## 10. Open items this pass did not fully close

- The prior deployment-aggregation research corpus (branch `research/deployment-aggregation`,
  `.llm/tmp/run/epic-deployment-aggregation/{deployment-architecture-spec,servy-assessment,
  decision-gap-tracker}.md` per `charter.md:62-64`) was **not present in this worktree** at the path
  named in the charter (`ls` returned "No such file or directory") — it likely lives only on that
  branch, not in the current worktree/branch. A follow-up pass (or Stage C synthesis) should `git
  show research/deployment-aggregation:.llm/tmp/run/epic-deployment-aggregation/servy-assessment.md`
  (or fetch the branch) to pull the SERVY=MODERNIZE verdict and gap tracker into synthesis — this
  corpus could not independently verify or cite that content.
- `#340` (`deno compile` artifact) and `#341` (rollback/health-gate/OTEL/secrets hardening) files
  were not individually re-verified beyond the `observability-convention.ts` filename match (§3) —
  worth a targeted `deno doc`/read pass in Stage D if the process-manager's health-check/rollback
  behavior needs to extend rather than duplicate #341's convention.
- The `#305/#306` doctrine-folder-shape reconciliation (top-level sibling `contracts/`/`services/`
  vs. doctrine-05's nested roles) is cited by the dashboard proposal as still open
  (`proposal.md:113-121`); a new `plugin-<x>-core` package should follow whatever DDX-2 lands as
  precedent (harness-observed CLI-scaffolder layout) rather than re-litigate it.
- Exact `PluginContribution` abstract class API (method signatures beyond the axis marker) was not
  read in full — only its re-export surface. If Stage D designs a genuinely new contribution axis
  (unlikely per §5's finding that existing axes suffice), read
  `packages/plugin/src/abstracts/plugin-telemetry-contribution.ts` and the sibling
  `plugin-*-contribution.ts` files as the concrete subclassing pattern.

## 11. Relevance to the NetScript process-manager plugin — summary

The repo already has every seam a process-manager plugin needs, at various stages of completeness:
a real `OsServicePort` + servy/systemd adapters (bare-metal OS-service layer, reuse directly), a
proven fat-core+thin-plugin composition pattern in two flavors (`workers` single-core,
`auth` core+adapter-fan-out), a contribution-axis system that already covers background processors,
services, telemetry, and runtime config with no new axis required, an Aspire contribution mechanism
whose `addDenoService`/`addDenoBackground` declarations are plausibly the *exact* input a bare-metal
supervisor would consume, a named-but-unbuilt Archetype-7 (Deployment Target Adapter) whose trigger
condition the process-manager satisfies precisely, and a sibling `epic:dev-dashboard` plan
(DDX-0…19) that has already solved "how does a supervision/telemetry core surface an admin UI as a
plugin-contributed panel" in exhaustive detail — including two concrete shared-dependency edges
(`command`/`app` `AspireResourceKind` extension; a `CommandInvokePort`-shaped lifecycle-action port)
that both epics independently need and should not each build in isolation. The main open design
work is not inventing new mechanism but **placing** the process-manager correctly against these
existing seams: which core package shape, whether its CLI rides the Archetype-7 deploy router or
gets its own verb set, and how literally to take the charter's "Deno Desktop app" framing against
the already-planned Aspire-hosted Fresh dashboard.
