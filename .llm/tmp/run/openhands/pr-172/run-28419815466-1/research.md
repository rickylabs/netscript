# Research — Plugin Runtime-Launch Contract

Run: `feat-scaffold-surface-167--runtime-launch-contract`
Branch/worktree: `feat/scaffold-surface-167` @ `/home/codex/repos/netscript-scaffold-167`
Debt closed by this work: `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS`
Archetype: ARCHETYPE-5 (plugin packages) + ARCHETYPE-6 (CLI generation) — fold the CLI concern inside.
Scope overlay: none (framework + plugin source).

## Why this run exists

The #157/#172 thin-dependency convergence made `plugin install` thin: it writes userland glue +
config edits + sample stubs and NEVER copies plugin internals into the generated project. The
scaffold-CLI bridge (`43c0050f`) and the install→list reconciliation (`2b61b24d`) are landed;
`deno task e2e:cli run scaffold.runtime --cleanup` now reaches `passed=21 failed=1`. The remaining
failure is `runtime.wait.workers-api`: the generated Aspire AppHost still launches the workers
service and background processor from a **copied** `plugins/workers` workdir that the thin install
never creates. This is the last chapter of the convergence — the **runtime-launch contract**.

## STEP 1 — Grounded current mechanism (file:line)

### 1. The failing gate `runtime.wait.workers-api`
- Generic `runtimeWaitGate(resource)` — `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:9-23`, fanned over every `ASPIRE_RESOURCE` at `:60` (`...Object.values(ASPIRE_RESOURCE).map(runtimeWaitGate)`).
- Runs `aspire wait workers-api --apphost <appHost> --non-interactive --nologo`.
- `workers-api` is the SERVICE resource (`ASPIRE_RESOURCE.WORKERS_API: 'workers-api'`, `cli-surface.ts:91`), distinct from the background processor `workers` (`:92`). For the gate to pass, the Aspire resource `workers-api` (workers HTTP API, port 8091) must actually start. Later behavior gates (`runtime-gates.ts:84-115`) probe `http://127.0.0.1:8091/health/live`, `/api/v1/workers/jobs`, etc.

### 2. How the generated project launches plugin runtimes today
AppHost helper generators emit `addExecutable(...)` with a workdir + entrypoint:
- SERVICE launch — `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:47-78`:
  - `workdir = entry.Workdir ?? 'plugins/<name>'` (`:47`); `entrypoint = entry.Entrypoint ?? RESOURCE_DEFAULTS.ServiceEntrypoint` (`:48`, default `src/main.ts` per `packages/aspire/constants.ts:103`).
  - Emits (`:67,:74`): `const workdir = resolveWorkspacePath(appHostDir, 'plugins/workers'); builder.addExecutable('workers-api', 'deno', workdir, ['run','--minimum-dependency-age=0','--node-modules-dir=none',...perms,'services/src/main.ts']).withHttpEndpoint({port:8091,env:'PORT'})`.
  - Sets `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` to `new URL('../../services/_shared/plugin-service-context.ts', import.meta.url).href` (`:68-69,:80`) — absolute file URL relative to the helper, resolving into the user project.
- BACKGROUND launch — `.../generate-register-background.ts:42-77`:
  - `workdir = entry.Workdir ?? name` (`:42`); `entrypoint = entry.Entrypoint ?? 'bin/combined.ts'` (`:26,:43`).
  - Emits (`:66,:73`): `const workers_workdir = resolveWorkspacePath(appHostDir, 'plugins/workers'); builder.addExecutable('workers','deno',workers_workdir,['run','--minimum-dependency-age=0','--node-modules-dir=none','--unstable-worker-options',...workers_perms,'bin/combined.ts'])`.
- `Workdir`/`Entrypoint` originate in `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`: background `Entrypoint = provider.defaultEntrypoint` (`:55`), `Workdir = scaffoldResult.backgroundWorkdir ?? plugins/<configKey>` (`:56-57`); service `Entrypoint = provider.defaultServiceEntrypoint` (`:99`), `Workdir = serviceWorkdir ?? plugins/<configKey>` (`:100-101`).
- Workdir resolves project-root-relative: `resolveWorkspacePath(appHostDir, rel) = resolve(appHostDir,'..','..',rel)` (`packages/aspire/src/application/resolve-paths.ts:36-41`).
- appsettings values come from install: `createPluginOwnedPluginResult` sets `backgroundWorkdir`/`serviceWorkdir` to `toWorkspaceRelativePath(projectRoot,'plugins/<pluginName>')` (`packages/cli/src/public/features/plugins/install/install-plugin.ts:365-368,381-386`). Dual registration (BackgroundProcessor + `<name>-api` service) decided in `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:116-135`.

**The defect:** both `workers-api` (service) and `workers` (background) launch from `cwd = <project>/plugins/workers`, which the thin install never creates. `aspire wait workers-api` never resolves.

### 3. Per-plugin export surface / background executable

| Plugin | category | service entrypoint | `./services` export | background entrypoint | `bin/` exists | bin exported |
|---|---|---|---|---|---|---|
| workers | background-processor | `services/src/main.ts` | YES | `bin/combined.ts` | YES | NO |
| sagas | background-processor | `services/src/main.ts` | YES | `bin/combined.ts` (manifest) | NO (dir absent) | NO |
| triggers | background-processor | `services/src/main.ts` | YES | `src/runtime/trigger-processor.ts` | NO bin; file in `src/**` | NO |
| streams | plugin | `services/src/main.ts` | **NO** | (none — service only) | NO | n/a |
| auth | plugin | `services/src/main.ts` | YES | (none — service only) | NO | n/a |

Evidence: each `plugins/<x>/deno.json` exports + `scaffold.plugin.json` provider blocks. Only `plugins/workers/bin/` exists (ls-confirmed).

- workers background executable `plugins/workers/bin/combined.ts` imports `./runtime.ts`, calls `startCombinedProcess(generated)`, and loads user jobs via `new URL('../../.netscript/generated/plugin-workers/jobs.registry.ts', import.meta.url)` — an `import.meta.url`-relative path.
- A runtime-start LIBRARY already exists: `plugins/workers/bin/runtime.ts` exports `startWorkerProcess`, `startSchedulerProcess`, `startCombinedProcess(options)`; `bin/combined.ts` is the thin executable wrapper. Neither is in `deno.json` exports → `deno run jsr:@netscript/plugin-workers/bin/combined.ts` = unknown export.
- The SERVICE `plugins/workers/services/src/main.ts` is already a library+executable hybrid: `export default async function createWorkersService(ctx)`; `if (import.meta.main)` reads `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE`, dynamically imports it, self-starts (`:69-84`). Exported as `./services`. Its context binding is cwd-independent (absolute file URL via env). The ONLY cwd coupling is that deno runs the entrypoint file from inside `plugins/workers`.

### 4. The userland glue install writes
`workers/mod.ts` is generated by `barrelScaffolder` (`plugins/workers/src/adapter/resources/barrel/barrel.ts:31-49`) from `barrel.stub.ts`: a definitions barrel (`export { <Job> } from './jobs/<job>.ts'`). It is INERT for runtime — it does NOT import the plugin dependency and starts nothing. The adapter declares `wiringEntry: '@netscript/plugin-workers/worker'` but the emitted `workers/mod.ts` does not import it.

## Contract-decision analysis (input to plan.md D1)

Recommendation: **Hybrid** — services launch by exported package subpath; background processors
launch via install-generated userland glue importing a new public `./runtime` library export.

1. **`import.meta.url`-relative user-data loading kills naive Shape A.** `bin/combined.ts` resolves the user's generated jobs registry via `import.meta.url`. Launched as `jsr:@netscript/plugin-workers/bin/combined.ts`, `import.meta.url` lives in the JSR cache, so `../../.netscript/generated/...` no longer points at the user project — the worker starts with zero user jobs, silently breaking `behavior.workers-executions`/trigger gates even if the health gate passes. Same hazard for `services/src/init.ts` registering a job with `entrypoint: './plugins/workers/jobs/health-check.ts'` (project-root-relative). Convention-bearing project-relative resolution MUST run from a module in the user project = the userland glue. This is the #157 thesis verbatim.
2. **The runtime-start library already exists** (`bin/runtime.ts: startCombinedProcess`). Shape B needs only promoting it to a public export (`@netscript/plugin-workers/runtime`) and having install-generated glue import it. The glue (~10 lines) becomes the AppHost entrypoint, owns project-relative discovery, passes discovered jobs into `startCombinedProcess(definitions)`. No internals copied.
3. **Core-centralization / minimal divergence.** Services are already uniform (`default export(ctx)` + `import.meta.main` self-start reading the bootstrap env var, cwd-independent). For services we need NO glue — launch the exported subpath directly (`jsr:@netscript/plugin-<x>/services`) with `cwd=projectRoot`. This is the one place a pure package-spec (Shape-A) launch is correct and duplication-free.
4. **JSR surface / score.** Shape B adds the smallest new surface: ONE `./runtime` per background-runtime plugin + making `./services` launchable-by-spec (workers/triggers/auth/sagas have it; streams must add it). New exports need `@module` + symbol docs or score drops and `publish --dry-run` slow-types/doc-lint warn. `startCombinedProcess` etc. are already documented.
5. **Marketplace JSR-URL model (#167/#168).** A package-spec contract (`jsr:@netscript/plugin-x/runtime` + `/services`) is exactly what a marketplace third-party plugin can satisfy; a copied-workdir contract cannot. Makes the launch contract uniform first-party + marketplace.
6. **Aspire process-launch model.** Aspire runs `deno run <args> <entrypoint>` in a `cwd`. The hybrid keeps the model identical (`addExecutable`); only what `Workdir`/`Entrypoint` resolve to changes: services → package-spec entrypoint, cwd=projectRoot; background → userland glue under projectRoot, cwd=projectRoot. The bootstrap-module env wiring already works for both.
