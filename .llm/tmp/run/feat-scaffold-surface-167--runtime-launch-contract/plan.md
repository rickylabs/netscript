# Plan — Plugin Runtime-Launch Contract

Run: `feat-scaffold-surface-167--runtime-launch-contract` · Branch: `feat/scaffold-surface-167`
Closes debt: `PLUGIN-RUNTIME-DEPENDENCY-ENTRYPOINT-EXPORTS`. See `research.md` for full grounding.
Archetype: ARCHETYPE-5 (plugins) + ARCHETYPE-6 (CLI generation). Implementation lane: WSL Codex
(framework/plugin source). Bar: `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0`.

## Locked decisions

- **D1.** Runtime-launch contract = **Hybrid**. SERVICES launch by package-spec export
  `jsr:@netscript/plugin-<x>/services` (cwd=projectRoot, bootstrap-module env unchanged). BACKGROUND
  processors launch via an install-generated userland glue entrypoint that imports a new public
  `@netscript/plugin-<x>/runtime` start library and performs project-relative discovery. No plugin
  internals copied. (Rationale: research.md §Contract-decision — `import.meta.url` hazard forces glue
  for background; services are already cwd-decoupled.)
- **D2.** New public JSR exports: `./runtime` (start API) on every background-runtime plugin;
  `./services` on every plugin (streams must add it). Background `bin/*.ts` files are NOT exported.
- **D3.** Project-relative user-data discovery (jobs registry, plugin job entrypoints) lives in the
  install-generated userland glue, NEVER in JSR-resident modules.
- **D4.** Only plugins with a real background executable get glue + `./runtime`: workers (real),
  triggers (real, `src/runtime/trigger-processor.ts`). Sagas declares a background processor but has
  NO `bin/` — Slice 0 reconciles (add a real `./runtime` start OR demote to service-only). auth +
  streams are service-only.

## Slices (each independently committable; smallest validating gate)

### Slice 0 — Reconcile sagas background-processor declaration (decision/spike)
Decide whether sagas needs a background processor (no `bin/` exists today; the old model would have
launched a missing entrypoint). Inspect `plugins/sagas` service vs runtime; pick (a) add a real
`src/runtime` start + `./runtime` export, or (b) set `provider.category='plugin'` + drop
`backgroundEntrypoint` so only `sagas-api` registers.
- **PLAN-EVAL refinement:** option (a) is largely a `deno.json` re-export — `sagas/src/runtime/saga-runner.ts`
  already exposes `runSagaRunner`/`startSagaRuntime` (its `registryModule` option is already
  parameterized, so glue passes `.netscript/generated/plugin-sagas/sagas.registry.ts` in — no
  `import.meta.url` resolution inside the library).
- Files: `plugins/sagas/scaffold.plugin.json` (provider block), possibly `plugins/sagas/src/runtime/mod.ts`.
- Gate: `cd plugins/sagas && deno task check`; `deno publish --dry-run --allow-dirty`.

### Slice 1 — Workers `./runtime` export + project-relative-safe API
Add `"./runtime": "./bin/runtime.ts"` to `plugins/workers/deno.json`. Ensure `bin/runtime.ts` has
`@module` + documented exported symbols; keep `startCombinedProcess(options)`; job-discovery is
parameterized (caller passes `definitions`), NEVER resolved via `import.meta.url` inside the library.
Leave `bin/combined.ts` for local `deno task` use; do not export it.
- Files: `plugins/workers/deno.json`, `plugins/workers/bin/runtime.ts` (docs if needed).
- Gate: `cd plugins/workers && deno task check && deno publish --dry-run --allow-dirty` (no new slow-type/doc-lint).

### Slice 2 — Triggers `./runtime` processor export
Confirm `src/runtime/trigger-processor.ts` exposes a documented start fn reachable from `./runtime`
(`src/runtime/mod.ts`); if not, add `"./runtime/processor"` export or re-export the start fn.
Standardize the start-fn name/signature with workers (core-centralization, R6).
- **PLAN-EVAL refinement:** standardize via an ADDITIVE shim (a new uniform-named re-export), NOT a
  rename — triggers' `./runtime` is already published; do not break its existing API.
- Files: `plugins/triggers/deno.json`, `plugins/triggers/src/runtime/mod.ts`.
- Gate: `cd plugins/triggers && deno task check && deno publish --dry-run --allow-dirty`.

### Slice 3 — Streams `./services` export
Add `"./services": "./services/src/main.ts"` to `plugins/streams/deno.json` (file already ships via
`services/**`). Add `@module`/symbol docs if missing.
- Files: `plugins/streams/deno.json`, possibly `plugins/streams/services/src/main.ts` (docs).
- Gate: `cd plugins/streams && deno task check && deno publish --dry-run --allow-dirty`.

### Slice 4 — Install: emit background runtime glue importing the dep
Add a runtime-glue scaffolder (sibling to `barrelScaffolder`) for background plugins that writes
`workers/runtime.ts` (and triggers equivalent) importing `@netscript/plugin-<x>/runtime`
`startCombinedProcess`, performing the project-relative jobs-registry discovery currently in
`bin/combined.ts`, self-starting under `import.meta.main`.
- **PLAN-EVAL refinement:** lock the glue-resource folder as `plugins/<x>/src/adapter/resources/glue/`
  (sibling to `barrel/`) before implementing.
- Files: `plugins/workers/src/adapter/resources/glue/` (new glue resource + stub alongside `barrel/`),
  wired into `workersStarterResources` in `plugins/workers/src/adapter/plugin.ts`; triggers analog.
- Gate: `cd plugins/workers && deno task check`; `cd packages/cli && deno test src/public/features/plugins/install/install-plugin_test.ts`.

### Slice 5 — CLI AppHost/appsettings generation: services by package-spec, background by glue
- SERVICE entries: `Entrypoint = 'jsr:@netscript/plugin-<x>/services'`, `Workdir = projectRoot`
  (drop `plugins/<name>` workdir). Adjust `buildPluginServiceEntry`/`buildBasePluginEntry`
  (`appsettings-entry-builders.ts:33-44,90-115`) + install workdir derivation (`install-plugin.ts:365-368`).
- BACKGROUND entries: `Entrypoint = '<glue path>'` (e.g. `workers/runtime.ts`), `Workdir = projectRoot`.
  `buildBackgroundProcessorEntry` (`appsettings-entry-builders.ts:47-88`).
- Generators: ensure `addExecutable('deno', workdir, ['run',...perms, entrypoint])` works when
  `entrypoint` is a `jsr:` spec (cwd=projectRoot) and perms/`--node-modules-dir=none` remain correct
  (`generate-register-plugins.ts:47-78`, `generate-register-background.ts:42-77`). Keep
  `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` wiring untouched (R5).
- Manifests: update `plugins/*/scaffold.plugin.json` `provider.defaultEntrypoint`/`defaultServiceEntrypoint` + `officialSource` to the new contract.
- Files: `appsettings-entry-builders.ts`, `install-plugin.ts`, `generate-register-plugins.ts`,
  `generate-register-background.ts`, all five `scaffold.plugin.json`.
- Gate: `cd packages/cli && deno test` (generator + workspace-mutator + install); `deno task lint`.

### Slice 6 — E2E alignment + final bar
Re-run the runtime suite; confirm `workers-api`, `workers`, `sagas-api`, `triggers-api`, `auth` wait
gates pass with NO `plugins/<x>` workdirs. Verify behavior gates (`behavior.workers-executions`,
`behavior.workers-trigger-health-job`), not just health/wait (R2).
- Gate (THE BAR): `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0` (native WSL worktree).

## Cross-cutting gates (per touched slice)
- Scoped: `cd plugins/<x> && deno task check`; root `deno task lint`; touched-file `deno fmt`.
- `deno publish --dry-run --allow-dirty` for EVERY touched plugin (workers, triggers, streams, sagas):
  new `./runtime`/`./services` exports MUST have `@module` + documented symbols (JSR score + slow-types).
- `deno task arch:check` — EXIT 0, all 13 roots FAIL=0.
- Bar: `deno task e2e:cli run scaffold.runtime --cleanup` → `failed=0`.

## Risks
- **R1 JSR surface growth.** Each `./runtime`/`./services` is a permanent contract. Mitigate: minimal
  surface, full docs, `publish --dry-run` per package before merge.
- **R2 discovery moved to glue.** `bin/combined.ts` + `services/src/init.ts` use `import.meta.url`/
  project-root-relative paths. With `cwd=projectRoot`, discovery must be re-expressed relative to the
  glue/project root. Mitigate: Slice 4 owns discovery in glue; verify behavior gates.
- **R3 Aspire workdir/command.** `addExecutable('deno',workdir,['run',...perms,entrypoint])` with
  `entrypoint='jsr:...'` + cwd=projectRoot must keep `--node-modules-dir=none`,
  `--unstable-worker-options`, perms, `withHttpEndpoint`. Mitigate: validate generated
  `register-*.mts` against a real `aspire start` in Slice 6.
- **R4 not all plugins have a background executable.** Only workers + triggers do; sagas declares one
  but lacks `bin/` (Slice 0). Mitigate: Slice 0 before Slice 5.
- **R5 bootstrap-module URL coupling.** Service depends on `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE`
  → user project `services/_shared/plugin-service-context.ts` (helper-relative). Launching by `jsr:`
  spec must NOT change that env wiring. Mitigate: keep helper-relative URL (lines 68-69/80); only
  change `Entrypoint`. PLAN-EVAL note: Aspire `WithEnvironment` env-var propagation is process-scope
  and survives a `jsr:`-spec launch (the env reaches the child `deno` process regardless of
  entrypoint form), so the bootstrap module still resolves.
- **R6 per-plugin runtime divergence.** Triggers background entrypoint differs from workers.
  Mitigate: standardize `./runtime` start-fn name/signature across background plugins (uniform glue).

## Critical files
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts`
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`
- `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts`
- `packages/cli/src/public/features/plugins/install/install-plugin.ts`
- `plugins/workers/deno.json` (+ peers `plugins/{triggers,streams,sagas}/deno.json` + five
  `scaffold.plugin.json` provider blocks); runtime lib `plugins/workers/bin/runtime.ts`; userland-glue
  scaffolder under `plugins/workers/src/adapter/resources/`.

## Design checkpoint
Every file traces to a named concept: new public `./runtime`/`./services` exports (D2), an
install-generated glue resource (D3/Slice 4), and CLI generation pointing at the new contract (Slice
5). No new folders outside doctrine vocabulary. No new `any`/casts beyond the 2 sanctioned categories.
PLAN-EVAL gate (OpenHands minimax-M3, separate session) is a hard stop before implementation.
