# Worklog — Slice S1: typesafe `@netscript/plugin/scaffold` core surface

Branch: `feat/scaffold-surface-167`
Worktree: `C:\Dev\repos\netscript-framework\.claude\worktrees\scaffold-surface-167`
Commit: `832fa9e8a6f8195451c28428ceea6714b70d916e`
Lane: Claude sub-agent (user override of default WSL-Codex lane — implemented here).

## Files created (under `packages/plugin/src/scaffold/`)

| File | Purpose |
| ---- | ------- |
| `artifact.ts` | `ScaffoldArtifact` value type `{ readonly path; readonly content }`. |
| `schema-url.ts` | `scaffoldSchemaUrl(version)` → JSR schema URL. |
| `json-format.ts` | Internal (not in barrel): `JsonValue`/`JsonArray`/`JsonObject`, `normalizeJson` (cast-free), `formatManifestJson` + private column-aware printer matching `deno fmt`. |
| `manifest-spec.ts` | `PluginScaffoldManifestSpec` + `buildScaffoldPluginJson(spec, version)` → byte-identical `scaffold.plugin.json`. |
| `options.ts` | `InvalidPluginNameError`, `ScaffoldPluginNameSource`, `readScaffoldPluginName` (single kebab `^[a-z][a-z0-9-]*$` parse). |
| `scaffold.ts` | `BuildArtifacts`, `PluginScaffoldSpec`, `createPluginScaffold` (composition factory over injected `FileSystemPort`; dryRun → `planned`/no writes; `databaseMigrationsAdded` on `.prisma`). |
| `cli.ts` | `ParsedScaffolderContext`, `parseScaffolderContextArgs`, `RunScaffoldCliOptions`, `runScaffoldCli`, `createDenoFileSystem` (real-FS adapter built at the composition edge). |
| `mod.ts` | Barrel (`@module` + `@example`); minimal public surface + re-exports of the public protocol/domain/ports types it exposes. |
| `manifest-spec.test.ts` | Byte-identity loop over all 5 committed manifests + version-injection + trailing-newline. |
| `options.test.ts` | valid/options-direct/invalid/missing/received-preserved. |
| `scaffold.test.ts` | writes via `MemoryFileSystemAdapter`, dryRun writes nothing + `planned`, skips unchanged, reports modified. |
| `test_fixtures/manifest-specs.ts` | 5 plugin specs + `committedSpecs` (S2 moves these into each plugin). |

## Files modified

- `packages/plugin/deno.json`
  - Added `"./scaffold": "./src/scaffold/mod.ts"` to `exports`.
  - Added `src/scaffold/mod.ts` to the `check` task entrypoints.
  - Added `"**/test_fixtures/**"` to `publish.exclude` so test fixtures never ship.

## scaffold.plugin.json formatting (byte-identity)

`deno fmt` (dprint) JSON rule reproduced in `json-format.ts`:
- 2-space indent, trailing newline, double-quoted keys/strings.
- Objects: always one entry per line.
- Arrays: collapse inline when `column + inlineLength <= 100` (column measured from the full line
  including the property-key prefix), else expand one item per line; empty arrays `[]`.
- Key order: `schemaVersion`, `name`, `version`, `displayName`, `description`, `peerDependencies`,
  `capabilities`, `scaffolder`, optional `postScripts`, optional `provider`, optional `officialSource`.

Result: `buildScaffoldPluginJson` reproduces all 5 committed `plugins/{workers,streams,sagas,triggers,auth}/scaffold.plugin.json` byte-for-byte (asserted in `manifest-spec.test.ts`).

## `--context-json` contract (preserved)

- Caller: `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:178-204`
  invokes the plugin `./scaffold` target as
  `deno run <perms> <target> --context-json '{"workspaceRoot":...,"options":{...},"dryRun":...}'`
  and reads the result from the last non-empty stdout line (`parseScaffoldResult` at L219).
- Callee: `parseScaffolderContextArgs` locates `--context-json`, `JSON.parse`s it, validates
  `{ workspaceRoot, options, dryRun }`; `runScaffoldCli` injects the logger, invokes the entrypoint,
  and writes `JSON.stringify(result) + "\n"` to stdout.

## `code-model.ts`

NOT created — per plan AP-9 (avoid a dynamic code-model abstraction). No genuinely dynamic file in
S1 required it; artifacts are plain `{ path, content }` produced by each plugin's `buildArtifacts`.

## Gates (run from the worktree; raw results)

| Gate | Command | Result |
| ---- | ------- | ------ |
| check | `run-deno-check.ts --root packages/plugin --ext ts,tsx` | `totalOccurrences:0` over 121 files (exit 0). |
| lint | `run-deno-lint.ts --root packages/plugin --ext ts,tsx` | `totalOccurrences:0` over 121 files (exit 0). |
| fmt | `run-deno-fmt.ts --root packages/plugin --ext ts,tsx` | `findings:[]`, `failedBatches:0` (exit 0). |
| test (suite) | `deno test --allow-all packages/plugin` | `38 passed | 0 failed`. |
| doc-lint (barrel) | `deno doc --lint src/scaffold/mod.ts` | `Checked 1 file` (exit 0). |
| doc-lint (full set) | `deno doc --lint src/scaffold/*.ts` (all 8) | `Checked 8 files` (exit 0). |
| publish dry-run | `deno publish --dry-run --allow-dirty` (`@netscript/plugin`) | `Success — Dry run complete`; no slow types; all 8 scaffold sources included; `*.test.ts` + `test_fixtures/**` excluded. |
| lock churn | `git diff --stat -- deno.lock` | empty (no churn). |

### doc-lint note (resolution)

Linting the scaffold files in isolation initially flagged `private-type-ref` for public package
types referenced by the scaffold surface (`PluginLogger`, `FileSystemPort`, `ScaffolderContext`,
`ScaffoldResult`, `PluginScaffoldEntrypoint`, and the `PluginManifest*` spec types incl. the
transitive `PluginScaffolderRequiredPermissions`). Resolved by re-exporting those already-public
types from the scaffold barrel so the `./scaffold` entrypoint's doc graph is self-contained. No
out-of-scope file (protocol/domain/ports source) was edited; the pre-existing doc-lint debt on
`./protocol`'s own entrypoint (`PluginManifestScaffolder` → `PluginScaffolderRequiredPermissions`)
predates this slice and is unchanged.

## Constraints honored

- No new type casts; no `any` (Reflect.get usage matches existing house style and is immediately
  re-narrowed). No abstract base class (composition factory + injected port). No string codegen, no
  casing module. Dependency direction respected (scaffold does not import `@netscript/cli`).
- Staged explicit paths only (never `git add -A`); did not touch `plugins/*` or `packages/cli`.
- No push, no PR.

---

# Worklog — Slice S2a: thin workers scaffolder (userland-only, no plugin-source copy)

Branch: `feat/scaffold-surface-167`
Worktree: `C:\Dev\repos\netscript-framework\.claude\worktrees\scaffold-surface-167`
Lane: Claude sub-agent (user override of default WSL-Codex lane — implemented here).
Reference plugin: the locked pattern here is replicated to streams/sagas/triggers/auth in S2b.

## Open item RESOLVED — confirmed userland emit layout (grounded against live CLI)

`--context-json` contract confirmed at
`packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:178-204`
(`runScaffoldEntrypoint`): the dispatcher invokes the plugin `./scaffold` target with
`--context-json '{"workspaceRoot":<projectRoot>,"options":{"pluginName":<name>},"dryRun":<bool>}'`
(only `pluginName` in `options`, built at L186-190) and parses the **last non-empty stdout line** as
the `ScaffoldResult` (`parseScaffoldResult` L219-230).

Division of labor confirmed at `add-plugin.ts:125-150`: the plugin-owned scaffolder
(`runPluginOwnedScaffold` → `dispatchPluginScaffold`) is responsible ONLY for the plugin's own
userland artifacts; CLI config wiring (`renderPluginSupport({importMode:'jsr'})` L134,
`updateAppsettings`, `ensureNetScriptConfigPlugin`, `ensureRootImportsForPluginKind`,
`ensureWorkspaceMember`) and `copyPluginSchemasToRootDb` (L144) are the CLI's job, NOT the
scaffolder's. So the thin scaffolder emits NO deno.json / appsettings / prisma.

**Confirmed userland emit set for workers (the only artifacts the thin `./scaffold` writes):**

| Workspace-relative path | Content | Source |
| ----------------------- | ------- | ------ |
| `workers/jobs/health-check.ts` | sample job (user-owned, editable) | `stubs/sample-job.ts` text-import |
| `workers/tasks/validate-payload.ts` | sample task (user-owned, editable) | `stubs/sample-task.ts` text-import |
| `workers/mod.ts` | background-workspace barrel re-exporting the two sibling stubs | `stubs/workers-barrel.ts` text-import |

Rationale for `workers/` (the background workspace, NOT `plugins/<name>/`):
`scaffold.plugin.json` `officialSource.backgroundDir = "workers"`; `scaffold.runtime.json`
`backgroundSampleRules[0].workspace = "workers"` with `managed: jobs/`, `tasks/` and
`keep: jobs/health-check.ts`; the runtime-registry generator scans `workers/jobs` (per
`scaffold.runtime.json` `runtimeRegistries[0].dir`). The e2e
`packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts:125` already lists `workers/mod.ts`
as a required userland artifact. The stubs are now **static** (the barrel references sibling local
files `./jobs/health-check.ts`, `./tasks/validate-payload.ts` — NOT the user instance name), so NO
interpolation/`String.replace` is needed (D-EMIT satisfied). Sample sources import the runtime core
`@netscript/plugin-workers-core` (the same specifier every real workers job/task uses today, e.g.
`plugins/workers/jobs/health-check.ts`).

NOTE on the old root barrel: the deleted `generateRootWorkersModule` re-exported
`../plugins/<name>/jobs/health-check.ts` + `../plugins/<name>/tasks/validate-payload.ts` — paths
that the no-copy model removes. The new barrel re-exports the **local** `workers/jobs` + `workers/tasks`
siblings, which is where the samples now actually live. This is the correct fix, not a regression.

DEP-INTERNAL paths NO LONGER emitted (came from `buildWorkerScaffoldArtifacts`, all deleted):
`plugins/<name>/{scaffold.plugin.json,deno.json,mod.ts,services/src/main.ts,services/src/router.ts,
contracts/v1/mod.ts,database/schema.prisma,bin/combined.ts}` — all resolve from
`jsr:@netscript/plugin-workers`.

Drift from the brief's assumed layout (recorded): the brief named files
`artifacts.ts`/`files.ts`/`scaffolder.ts`/`generate{ServiceMain,...}`; the actual workers tree had
`src/scaffold/{artifacts.ts,files.ts,files_test.ts,mod.ts}` plus a top-level `scaffold.ts` wrapper.
The separate `src/scaffolding/` tree (item-scaffolders for `nsc workers add-job/add-task`, exported
as `./scaffolding`) is a legitimate plugin runtime feature, NOT a `plugin add` generator — left
untouched.

## Files written (S2a)

| File | Role |
| ---- | ---- |
| `plugins/workers/src/scaffold/spec.ts` | Data-only: `workersManifestSpec` (migrated verbatim from S1 fixtures), `WORKERS_SAMPLE_STUBS` (text-imported stub → emit-path map), dep specifier const. |
| `plugins/workers/src/scaffold/scaffolder.ts` | `buildArtifacts(context)` → the 3 userland `ScaffoldArtifact`s; validates context via `readScaffoldPluginName`. |
| `plugins/workers/src/scaffold/mod.ts` | Thin compose: `createPluginScaffold({ fileSystem: createDenoFileSystem(), buildArtifacts })` + `import.meta.main` → `runScaffoldCli`. |
| `plugins/workers/scaffold.ts` | Top-level `./scaffold` target: re-exports `scaffold`, drives `runScaffoldCli` when main. |
| `plugins/workers/src/scaffold/stubs/jobs/health-check.ts` | Real type-checked sample job (`defineJobHandler`). |
| `plugins/workers/src/scaffold/stubs/tasks/validate-payload.ts` | Real type-checked sample task (`defineTask().handler().build()`). |
| `plugins/workers/src/scaffold/stubs/mod.ts` | Barrel stub re-exporting the two local siblings (emits to `workers/mod.ts`). |
| `plugins/workers/src/scaffold/scaffold.test.ts` | Byte-identity + buildArtifacts userland-only (forbidden-prefix sweep) + dryRun/applied via `MemoryFileSystemAdapter`. |

Deleted: `src/scaffold/artifacts.ts`, `src/scaffold/files.ts`, `src/scaffold/files_test.ts`
(DEP-INTERNAL generators + bespoke writer + local readPluginName, all replaced by the S1 toolkit).

Modified: `plugins/workers/deno.json` (added `src/scaffold/stubs/mod.ts` to the `check` task so all
3 stubs are type-checked; no import-map change → no lock churn); migrated workers entry OUT of
`packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts` (removed `workersSpec` + its
`committedSpecs` row — S1 byte-identity test now covers the remaining 4).

### Stub annotation note (isolatedDeclarations)

Publishable plugins are checked under `--isolatedDeclarations`, so every exported stub const needs an
explicit type annotation. Applied: `healthCheckJob: (context: JobHandlerContext) => JobResult |
Promise<JobResult>`, `validatePayloadTask: TaskDefinition<'validate-payload'>`, `scaffold:
PluginScaffoldEntrypoint`. NO new type casts were introduced (the 2 sanctioned repo-wide casts are
untouched); `context.payload` is read directly off the typed `JobHandlerContext` (the brief-era
draft's `(context as {...})` cast was removed before any gate). The test imports `@std/assert` via a
full `jsr:` specifier rather than an import-map entry, specifically to avoid `deno.lock` churn.

## Gates (run from the worktree; raw results)

| Gate | Command | Result |
| ---- | ------- | ------ |
| check | `run-deno-check.ts --root plugins/workers --root packages/plugin --ext ts,tsx` | `totalOccurrences:0`, `failedBatches:0` over 206 files (exit 0). |
| lint | `run-deno-lint.ts --root plugins/workers --root packages/plugin --ext ts,tsx` | `exitCode:0`, `totalOccurrences:0` over 206 files. |
| fmt | `run-deno-fmt.ts --root plugins/workers --root packages/plugin --ext ts,tsx` | `findings:0`, `failedBatches:0` over 206 files. |
| test | `deno test --allow-all plugins/workers packages/plugin` | `57 passed | 0 failed`. Workers scaffold suite: `6 passed | 0 failed` (byte-identity + userland-only + dryRun). |
| publish dry-run | `deno publish --dry-run --allow-dirty` (`@netscript/plugin-workers`) | `Success — Dry run complete`; new `scaffolder.ts`/`spec.ts`/`stubs/**` included, old `artifacts.ts`/`files.ts` gone, `scaffold.test.ts` excluded; only pre-existing `unanalyzable-dynamic-import` warns, no slow types. |
| scaffold versions | `deno task check:scaffold-versions` | `E-12 OK — 10 scaffold pin(s) are stable` (exit 0). |
| lock churn | `git diff --stat -- deno.lock` | empty (no churn). |

### `plugins:check` substitution + pre-existing doctrine FAIL (out of scope)

The brief listed `deno task plugins:check`; that task does not exist in `deno.json`. Substituted the
in-scope equivalents: `check:scaffold-versions` (manifest version pins — green) and the doctrine
fitness check on the touched plugin (`check-doctrine.ts --root plugins/workers`).

`check-doctrine.ts --root plugins/workers` returns `FAIL=1 WARN=5 INFO=2`. The single FAIL is
**pre-existing and outside S2a's scope**: `FAIL A4: abstract class WorkersCliCommand declares no
abstract members` in `src/cli/commands.ts` — a file S2a never touched (verified via `git status`:
the only modified workers files are `deno.json`, `scaffold.ts`, `src/scaffold/**`). It is a CLI-command
subsystem debt, not a scaffold-surface regression. The scaffold-surface files introduced by S2a add
no doctrine violation (check/lint/fmt/publish all green; thin scaffolder imports only
`@netscript/plugin` + `@netscript/plugin-workers-core`, never `@netscript/cli`). Recorded here as
pre-existing debt for the S2b/cleanup owner, not fixed in this slice (in-scope-only edit discipline).

### Stray plan.md edit reverted

A `plan.md` edit (D-EMIT/`code-model.ts` refinement) made earlier in the session was reverted with
`git checkout -- plan.md`: PLAN-EVAL already PASSed and the implementation session must not re-plan.
The implementation reality (`src/scaffold/stubs/` layout) is recorded here in `worklog.md`, the
correct home for drift.

---

# Worklog — Slice S2b (1/3): thin sagas scaffolder (userland-only, no plugin-source copy)

Branch: `feat/scaffold-surface-167`
Commit: `507c744c`
Lane: Claude sub-agent (user override of default WSL-Codex lane).
Pattern: replicated verbatim from the S2a workers reference.

## Confirmed userland emit layout (sagas)

`scaffold.plugin.json` `officialSource.backgroundDir = "sagas"`, so the thin `./scaffold` emits the
three user-owned samples under the `sagas/` background workspace (NOT `plugins/<name>/`):

| Workspace-relative path | Content | Source stub |
| ----------------------- | ------- | ----------- |
| `sagas/user-registration-saga.ts` | sample saga definition (`defineSaga().build()`) | `stubs/user-registration-saga.ts` text-import |
| `sagas/user-registration.config.ts` | sample config entry (`defineSagaConfig().build()`) | `stubs/user-registration.config.ts` text-import |
| `sagas/mod.ts` | background-workspace barrel re-exporting the two siblings | `stubs/mod.ts` text-import |

The old `buildSagasScaffoldArtifacts` emitted 13 files (one userland trio plus 10 DEP-INTERNAL
files: `plugins/<name>/{scaffold.plugin.json,deno.json,mod.ts,services/src/{main,router,init}.ts,
contracts/v1/mod.ts,database/sagas.prisma,src/runtime/saga-runner.ts,src/aspire/mod.ts}`). All ten
dep-internal files are now gone — they resolve from `jsr:@netscript/plugin-sagas`. The old root
barrel re-exported `../plugins/<name>/sagas/user-registration-saga.ts` (+ `.config.ts`); the new
barrel re-exports the **local** `./user-registration-saga.ts` + `./user-registration.config.ts`
siblings (the workers fix), so the stubs are fully static — no `pluginName` interpolation.

Stub bodies are byte-faithful to the old `SagaDefinitionScaffolder`/`SagaConfigScaffolder` generator
output for the canonical sample input (`id: 'user-registration'`, `messageType: 'user.registered'`,
`durability: 't1'`, `topic: 'users'`, `tags: ['sample','users']`), modulo the doc-header `@module`
block and the explicit type annotations required below. Sample sources import only the published
runtime core `@netscript/plugin-sagas-core` (+ `/config`, `/domain` type subpaths) — never
`@netscript/cli`, never plugin internals.

## Files written / deleted / modified

| File | Role |
| ---- | ---- |
| `plugins/sagas/src/scaffold/spec.ts` | Data-only: `sagasManifestSpec` (migrated verbatim from S1 fixtures), `SAGAS_SAMPLE_STUBS`, `SAGAS_RUNTIME_CORE_SPECIFIER`, `SAGAS_BACKGROUND_WORKSPACE`. |
| `plugins/sagas/src/scaffold/scaffolder.ts` | `buildArtifacts(context)` → the 3 userland artifacts; validates via `readScaffoldPluginName`. |
| `plugins/sagas/src/scaffold/mod.ts` | Thin compose (`createPluginScaffold({ fileSystem: createDenoFileSystem(), buildArtifacts })` + `import.meta.main` → `runScaffoldCli`). Replaced the old 121-line local-redecl module. |
| `plugins/sagas/scaffold.ts` | Top-level `./scaffold` target; dropped the old `export type { ScaffolderContext, ScaffoldResult }` re-exports (those types now come from `@netscript/plugin`). |
| `plugins/sagas/src/scaffold/stubs/user-registration-saga.ts` | Real type-checked sample saga. |
| `plugins/sagas/src/scaffold/stubs/user-registration.config.ts` | Real type-checked sample config entry. |
| `plugins/sagas/src/scaffold/stubs/mod.ts` | Barrel stub re-exporting the two local siblings (emits to `sagas/mod.ts`). |
| `plugins/sagas/src/scaffold/scaffold.test.ts` | Byte-identity + userland-only forbidden-prefix sweep + dryRun/applied via `MemoryFileSystemAdapter`. |

Deleted: `src/scaffold/artifacts.ts`, `src/scaffold/files.ts` (no `*_test.ts` existed for sagas).

Modified: `plugins/sagas/deno.json` (`check` task: added `src/scaffold/stubs/mod.ts`; no import-map
change → no lock churn). `packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts` (removed
`sagasSpec` + its `committedSpecs` row + updated the module-doc count note; S1 byte-identity test now
iterates streams/triggers/auth only).

### Stub annotation note (isolatedDeclarations / slow-types)

Explicit annotations required on the exported stub consts:
`UserRegistrationSaga: SagaDefinition<'user-registration', State, Message>` (local `State`/`Message`
types satisfy the `SagaState`/`SagaMessage` constraints) and
`UserRegistrationSagaConfig: SagaConfigEntry<'user-registration'>`. NO new type casts; no `any`. The
test imports `@std/path` (`fromFileUrl`) and `@std/assert` via full `jsr:@std/...@^1` specifiers
(sagas deno.json has neither in its import map) specifically to avoid `deno.lock` churn.

## Gates (run from the worktree; raw results)

| Gate | Command | Result |
| ---- | ------- | ------ |
| check | `deno check --unstable-kv scaffold.ts src/scaffold/{mod,scaffolder,spec}.ts src/scaffold/stubs/mod.ts` | all `Check` lines, exit 0. |
| check (fixtures) | `deno check --unstable-kv packages/plugin/.../test_fixtures/manifest-specs.ts` | exit 0. |
| lint | `deno lint plugins/sagas/src/scaffold plugins/sagas/scaffold.ts` | `Checked 8 files`, 0 findings. |
| fmt | `deno fmt --check` (sagas scaffold + scaffold.ts + migrated fixtures) | `Checked 9 files`, clean. |
| test (sagas) | `deno test src/scaffold/scaffold.test.ts` | `6 passed | 0 failed` (byte-identity green). |
| test (S1 fixture) | `deno test packages/plugin/.../manifest-spec.test.ts` | `3 passed | 0 failed` (committedSpecs now streams/triggers/auth). |
| publish dry-run | `deno publish --dry-run --allow-dirty` (`@netscript/plugin-sagas`) | `Success — Dry run complete`; stubs included in tarball, NOT public API; no slow types; only pre-existing `unanalyzable-dynamic-import` warns. |
| scaffold versions | `deno task check:scaffold-versions` | `E-12 OK — 10 scaffold pin(s) are stable` (exit 0). |
| lock churn | `git status --porcelain deno.lock` | empty (no churn). |

### Byte-identity outcome

`buildScaffoldPluginJson(sagasManifestSpec, '0.0.1-alpha.12')` reproduces the committed
`plugins/sagas/scaffold.plugin.json` byte-for-byte (asserted, green).

### doc-lint note (per-stub false positive — NOT a publish gate)

Running `deno doc --lint` directly on the leaf stub files reports `private-type-ref` for
`UserRegistrationSaga → Message` (a genuinely module-private local type) and
`UserRegistrationSagaConfig → SagaConfigEntry`. This is a false positive for the publish surface: the
stubs are NOT in any sagas `exports` entry (they are text-imported leaves), so they are not public
API. The authoritative publish-surface gate — `deno publish --dry-run` — passes with no slow types
(matching the S2a workers gate matrix, which also used publish dry-run, not per-stub doc-lint, as the
publish authority). No action needed; recorded so the S2b triggers/streams slices apply the same rule
(local stub types are fine; the publish gate is `publish --dry-run`, not `doc --lint <stub>`).

## Constraints honored

- No new casts (2 sanctioned untouched); no `any`. Dependency direction clean (imports only
  `@netscript/plugin*` + `@netscript/plugin-sagas-core`).
- Staged explicit paths only (never `git add -A`); `run` artifact `commits.md` left untracked, not
  committed. One plugin = one commit. Did not touch auth or `packages/cli`.
- No push, no PR.

---

# S2b — triggers (commit `40faebe8`)

## Confirmed emit layout

`plugin add triggers` emits exactly **4** userland files, all under the `triggers/` background
workspace (matches the old scaffolder's `backgroundDir: 'triggers'`), in this emission order: the
three leaf trigger samples first, the barrel last.

```
triggers/generic-inbound-webhook.ts   # webhook  id 'generic-inbound-webhook'  path 'inbound/generic'  verifier 'hmac-sha256'
triggers/daily-maintenance.ts         # scheduled id 'daily-maintenance'  cron '0 3 * * *'  persistent false  backfill {enabled,windowMs 3_600_000,policy 'fire-once'}
triggers/incoming-file-watch.ts       # file-watch id 'incoming-file-watch'  paths ['./shared/incoming']  patterns ['*.json','*.csv']  ignored ['*.tmp','.*']  on ['create']  debounceMs 2_000  stability {checkIntervalMs 1_000, stableChecks 3}
triggers/mod.ts                       # barrel re-exporting the three local sibling consts
```

Stub bodies are byte-faithful to the old `trigger-scaffolders.ts` generator output for the three
canonical sample inputs (webhook / scheduled / file-watch), modulo the doc-header `@module` block,
the explicit `*Definition<...>` type annotations (slow-types), and one `deno-lint-ignore` per handler
(see below). Sample sources import only the published runtime core
`@netscript/plugin-triggers-core/builders` (+ `/domain` type subpath) — never `@netscript/cli`,
never plugin internals. Export names: `genericInboundWebhookTrigger`, `dailyMaintenanceTrigger`,
`incomingFileWatchTrigger`. The old root barrel re-exported `../plugins/<name>/triggers/<id>.ts`;
the new barrel re-exports the **local** siblings, so the stubs are fully static (no `pluginName`
interpolation).

## Files written / deleted / modified

| File | Role |
| ---- | ---- |
| `plugins/triggers/src/scaffold/spec.ts` | Data-only: `triggersManifestSpec` (migrated verbatim from S1 fixtures), `TRIGGERS_SAMPLE_STUBS` (4 stubs under `triggers/`), `TRIGGERS_RUNTIME_CORE_SPECIFIER`, `TRIGGERS_BACKGROUND_WORKSPACE`. |
| `plugins/triggers/src/scaffold/scaffolder.ts` | `buildArtifacts(context)` → the 4 userland artifacts; validates via `readScaffoldPluginName`. |
| `plugins/triggers/src/scaffold/mod.ts` | Thin compose (`createPluginScaffold({ fileSystem: createDenoFileSystem(), buildArtifacts })` + `import.meta.main` → `runScaffoldCli`). Replaced the old 121-line local-redecl module. |
| `plugins/triggers/scaffold.ts` | Top-level `./scaffold` target; dropped the old `export type { ScaffolderContext, ScaffoldResult }` re-exports + the old bare `runScaffoldCli()` guard (now `runScaffoldCli({ entrypoint: scaffold })`). |
| `plugins/triggers/src/scaffold/stubs/generic-inbound-webhook.ts` | Real type-checked sample webhook trigger. |
| `plugins/triggers/src/scaffold/stubs/daily-maintenance.ts` | Real type-checked sample scheduled (cron) trigger. |
| `plugins/triggers/src/scaffold/stubs/incoming-file-watch.ts` | Real type-checked sample file-watch trigger. |
| `plugins/triggers/src/scaffold/stubs/mod.ts` | Barrel stub re-exporting the three local sibling consts (emits to `triggers/mod.ts`). |
| `plugins/triggers/src/scaffold/scaffold.test.ts` | Byte-identity + userland-only forbidden-prefix sweep + runtime-core-import assertions + dryRun/applied via `MemoryFileSystemAdapter`. |

Deleted: `src/scaffold/artifacts.ts`, `src/scaffold/files.ts` (no `*_test.ts` existed for triggers).

Modified: `plugins/triggers/deno.json` (`check` task: added `src/scaffold/stubs/mod.ts`; no
import-map change → no lock churn). `packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts`
(removed `triggersSpec` + its `committedSpecs` row + updated the module-doc note; S1 byte-identity
test now iterates **streams/auth only**).

### Stub annotation note (isolatedDeclarations / slow-types)

Explicit FULL generic annotations required on the exported stub consts (short-form `*Definition<TId>`
fails handler **contravariance** assignability):
`genericInboundWebhookTrigger: WebhookDefinition<'generic-inbound-webhook', TriggerEvent<'webhook', WebhookTriggerPayload<unknown>>, TriggerContext>`,
`dailyMaintenanceTrigger: ScheduledTriggerDefinition<'daily-maintenance', TriggerEvent<'scheduled', ScheduledTriggerPayload>, TriggerContext>`,
`incomingFileWatchTrigger: FileWatchDefinition<'incoming-file-watch', TriggerEvent<'file-watch', FileWatchTriggerPayload>, TriggerContext>`.
The `id: '<id>' as const` const-assertion is from the verbatim generator output (narrows the literal
id) — it is NOT one of the prohibited type casts and is not a new cast. No `any`. The test imports
`@std/path` (`fromFileUrl`, mapped in triggers deno.json) bare and `@std/assert` via full
`jsr:@std/assert@^1` (matching the workers test) — no lock churn.

### lint require-await note

The trigger handler contract is `(event, context) => Promise<readonly TriggerActionResult[]>`
(strictly a Promise, not `T | Promise<T>`), so the starter handlers must be `async () => []`. The
empty bodies trip `require-await`; resolved with a single
`// deno-lint-ignore require-await -- starter handler; the runtime contract is async.` above each of
the three handlers (the generator emitted bare `async () => { return []; }` because its output landed
in userland, outside the plugin's lint scope; as real in-package stubs they now fall under plugin
lint). Lint is clean (0 findings) after the ignore comments.

## Gates (run from the worktree; raw results)

| Gate | Command | Result |
| ---- | ------- | ------ |
| check | `deno task --cwd plugins/triggers check` (full check task incl. `src/scaffold/stubs/mod.ts`) | all `Check` lines, exit 0. |
| lint | `deno lint plugins/triggers/src/scaffold plugins/triggers/scaffold.ts <fixture>` | `Checked 10 files`, 0 findings. |
| fmt | `deno fmt --check` (triggers scaffold + scaffold.ts + deno.json + migrated fixtures) | `Checked 11 files`, clean. |
| test (triggers) | `deno test src/scaffold/scaffold.test.ts` | `6 passed | 0 failed` (byte-identity green). |
| test (S1 fixture) | `deno test packages/plugin/.../manifest-spec.test.ts` | `3 passed | 0 failed` (committedSpecs now streams/auth). |
| publish dry-run | `deno task --cwd plugins/triggers publish:dry-run` (`@netscript/plugin-triggers`) | `Success — Dry run complete`; 4 stubs included in tarball, NOT public API; no slow types. |
| scaffold versions | `deno task check:scaffold-versions` | `E-12 OK — 10 scaffold pin(s) are stable` (exit 0). |
| lock churn | `git status --porcelain deno.lock` | empty (no churn). |

### Byte-identity outcome

`buildScaffoldPluginJson(triggersManifestSpec, '0.0.1-alpha.12')` reproduces the committed
`plugins/triggers/scaffold.plugin.json` byte-for-byte (asserted, green). The migrated
`triggersManifestSpec` is identical to the S1 `triggersSpec` fixture (note: `concurrencyEnvVar:
'TRIGGER_CONCURRENCY'`, `defaultConcurrency: 10` — these match the committed manifest, which is the
byte-identity authority, even though the old `artifacts.ts` used a different concurrency env name in
generated runtime config).

## Constraints honored

- No new casts (2 sanctioned untouched; the `as const` id assertions are verbatim-generator literal
  narrowing, not new casts); no `any`. Dependency direction clean (imports only `@netscript/plugin*`
  + `@netscript/plugin-triggers-core`).
- Staged explicit paths only (never `git add -A`); `run` artifacts `commits.md`/`worklog.md` left
  untracked/unstaged, not committed. One plugin = one commit. Did not touch auth or `packages/cli`.
- No push, no PR.

---

# S2b — streams (commit `72b02943`)

## Divergence from workers/sagas/triggers — settled

Streams was the **heaviest** legacy scaffolder and the clearest anti-pattern S2 eliminates. Its old
`buildStreamsScaffoldArtifacts` did NOT emit a userland sample at all — it emitted an **entire second
copy of the plugin** into `plugins/<name>/`: `scaffold.plugin.json`, `deno.json`, `mod.ts` (a full
`definePlugin(...).build()`), `services/src/{main,routes}.ts`, `src/streams/mod.ts`, `src/aspire/mod.ts`,
`src/e2e/mod.ts` — 8 generated files, all interpolated on `pluginName`. There was no `backgroundDir`;
`pluginDir` is `streams`. There is **no `scaffold.runtime.json`** for streams, and the e2e suite does
not constrain streams userland paths, so the emit shape was a free design decision.

**Settled thin design (applied):** `plugin add streams` now emits **2** userland files under the
`streams/` workspace (matching `pluginDir`), in emission order:

```
streams/notifications-stream.ts   # defineStreamSchema(...) + createDurableStream(...) sample, static
streams/mod.ts                    # barrel re-exporting the local sample's two named consts
```

The sample's body is lifted from the old `generateStreamsModule` output (a `defineStreamSchema`
collection + a `createDurableStream` producer), made fully static (no `pluginName` interpolation):
collection `notifications.event`, producer `streamPath '/v1/streams/notifications/events'`,
`producerId 'notifications-producer'`. It imports only `@netscript/plugin-streams-core` (+ `zod`,
already in the streams import map) — never `@netscript/cli`, never the plugin's own `services/`,
`src/streams/`, `src/aspire/`, `src/e2e/`. The whole `plugins/<name>/` second-copy tree is gone; that
infrastructure now resolves from the `@netscript/plugin-streams` dependency. The test's
forbidden-prefix sweep explicitly asserts `plugins/`, `services/`, `src/streams/`, `src/aspire/`,
`src/e2e/`, `scaffold.plugin.json` are never emitted, proving the copy is eliminated.

## Files written / deleted / modified

| File | Role |
| ---- | ---- |
| `plugins/streams/src/scaffold/spec.ts` | Data-only: `streamsManifestSpec` (migrated verbatim from S1 fixtures), `STREAMS_SAMPLE_STUBS` (2 stubs under `streams/`), `STREAMS_RUNTIME_CORE_SPECIFIER`, `STREAMS_SAMPLE_WORKSPACE`. |
| `plugins/streams/src/scaffold/scaffolder.ts` | `buildArtifacts(context)` → the 2 userland artifacts; validates via `readScaffoldPluginName`. |
| `plugins/streams/src/scaffold/mod.ts` | Thin compose. Replaced the old 121-line local-redecl module (which built the full plugin-copy artifact set). |
| `plugins/streams/scaffold.ts` | Top-level `./scaffold` target; new `runScaffoldCli({ entrypoint: scaffold })` shape (streams had no old type re-exports to drop). |
| `plugins/streams/src/scaffold/stubs/notifications-stream.ts` | Real type-checked sample durable stream (schema + producer). |
| `plugins/streams/src/scaffold/stubs/mod.ts` | Barrel stub re-exporting the local sample's two consts (emits to `streams/mod.ts`). |
| `plugins/streams/src/scaffold/scaffold.test.ts` | Byte-identity + userland-only forbidden-prefix sweep (incl. `plugins/`) + runtime-core-import assertions + dryRun/applied via `MemoryFileSystemAdapter`. |

Deleted: `src/scaffold/artifacts.ts`, `src/scaffold/files.ts` (no `*_test.ts` existed for streams).

Modified: `plugins/streams/deno.json` (`check` task: added `src/scaffold/stubs/mod.ts`; no import-map
change → no lock churn). `packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts` (removed
`streamsSpec` + its `committedSpecs` row + rewrote the module doc; **only `authSpec` remains** and the
S1 byte-identity test now iterates auth only).

### Stub annotation note (isolatedDeclarations / slow-types)

Local `NotificationsStreamDefinition extends StreamStateDefinition` type alias added so the two
exported consts get explicit annotations: `notificationsStreamSchema: StateSchema<NotificationsStreamDefinition>`
and `notificationsStream: DurableStreamProducer<NotificationsStreamDefinition>`. No new casts; no
`any`. The test imports BOTH `@std/path` and `@std/assert` via full `jsr:@std/...@^1` specifiers
(streams deno.json maps neither — only `@std/net`), avoiding lock churn.

## Gates (run from the worktree; raw results)

| Gate | Command | Result |
| ---- | ------- | ------ |
| check | `deno task --cwd plugins/streams check` (full check task incl. `src/scaffold/stubs/mod.ts`) | all `Check` lines, exit 0. |
| lint | `deno lint plugins/streams/src/scaffold plugins/streams/scaffold.ts <fixture>` | `Checked 8 files`, 0 findings. |
| fmt | `deno fmt --check` (streams scaffold + scaffold.ts + deno.json + migrated fixtures) | `Checked 9 files`, clean (auto-fmt applied a `type`-import sort in the stub + a `.find` callback re-wrap in the test before commit). |
| test (streams) | `deno test src/scaffold/scaffold.test.ts` | `6 passed | 0 failed` (byte-identity green). |
| test (S1 fixture) | `deno test packages/plugin/.../manifest-spec.test.ts` | `3 passed | 0 failed` (committedSpecs now **auth only**). |
| publish dry-run | `deno task --cwd plugins/streams publish:dry-run` (`@netscript/plugin-streams`) | `Success — Dry run complete`; 2 stubs included in tarball, NOT public API; no slow types. |
| scaffold versions | `deno task check:scaffold-versions` | `E-12 OK — 10 scaffold pin(s) are stable` (exit 0). |
| lock churn | `git status --porcelain deno.lock` | empty (no churn). |

### Byte-identity outcome

`buildScaffoldPluginJson(streamsManifestSpec, '0.0.1-alpha.12')` reproduces the committed
`plugins/streams/scaffold.plugin.json` byte-for-byte (asserted, green).

## Constraints honored

- No new casts (2 sanctioned untouched); no `any`. Dependency direction clean (imports only
  `@netscript/plugin*` + `@netscript/plugin-streams-core` + `zod`).
- Staged explicit paths only (never `git add -A`); `run` artifacts `commits.md`/`worklog.md` left
  untracked/unstaged, not committed. One plugin = one commit. Did not touch auth or `packages/cli`.
- No push, no PR.

---

# S2b — final state

- **test_fixtures migration complete:** `packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts`
  now contains **only `authSpec`**; `committedSpecs = [{ dir: 'auth', spec: authSpec }]`. Workers
  (S2a), sagas, triggers, streams (S2b) all own their byte-identity tests in-package. The auth slice
  must migrate `authSpec` out and empty/retire this fixture file.
- **3 commits, in order:** sagas `507c744c`, triggers `40faebe8`, streams `72b02943` — each gated
  green before the next; never two commits staged at once.
- **Auth slice notes:** auth is the last `committedSpecs` entry; follow the same pattern
  (spec.ts + stubs/ + scaffolder.ts + thin mod.ts + scaffold.ts + scaffold.test.ts; delete
  artifacts.ts/files.ts; add `src/scaffold/stubs/mod.ts` to the check task; migrate `authSpec`). Auth
  has DB migrations (`hasDatabaseMigrations: true`) so its scaffolder may emit a `.prisma` sample —
  if so, `createPluginScaffold` sets `databaseMigrationsAdded: true` for `.prisma` artifacts and the
  test should assert that. The publish authority remains `deno publish --dry-run` (NOT per-stub
  `deno doc --lint`, which false-positives on module-private local stub types).

---

# S2c — thin auth scaffolder (userland-only, no plugin-source copy) — FINAL plugin, S2 complete

## Grounded auth userland surface (recorded before coding)

Auth diverges from every other plugin: the legacy scaffolder used a 26-entry `AUTH_ARTIFACT_SOURCES`
map (`src/scaffold/artifacts.ts`) + `src/scaffold/templates/**` (26 files) + a bespoke
`writePlannedFiles` (`src/scaffold/files.ts`) to copy an **entire second `plugins/<name>/` plugin
tree** into userland — including the plugin's own `deno.json` (a verbatim copy of
`plugins/auth/deno.json`), `package.json`, `scaffold.plugin.json`, `services/**`, `src/**`,
`streams/**`, and `database/auth.prisma`. I read all 26 templates; **every one is DEP-INTERNAL** (the
full plugin-copy anti-pattern, identical disease to streams/workers). Notably
`services-src-backend-registry-ts.ts` is the plugin's **own env-driven service composition root**
(imported by `services/src/init.ts` → `main.ts`, fully `NETSCRIPT_AUTH_BACKEND`-driven) — it resolves
from `jsr:@netscript/plugin-auth/services`, it is NOT a userland file. (A grounding agent suggested
emitting it as user-owned; I rejected that — the auth config seam is env/appsettings, CLI-owned, not
a userland TS file.)

**Three grounding agents** confirmed the decision:

1. **prisma agent:** D-PRISMA — emit NO `.prisma`. `copyPluginSchemasToRootDb`
   (`packages/cli/src/kernel/adapters/plugin/db-integration.ts`) copies
   `plugins/auth/database/auth.prisma` (which ships in the dep tarball via auth's
   `publish.include: database/**/*.prisma`) into the root DB at `db generate`. The old scaffold
   `database-auth-prisma.ts` template was byte-identical to the real `auth.prisma`. ⇒
   `databaseMigrationsAdded: false`.
2. **wiring agent:** suggested keeping `backend-registry.ts` userland — **rejected** (dep-internal, see
   above).
3. **e2e / scaffold.runtime agent (authority on the minimal userland set):** the e2e
   `true-userland-install-suite.ts` asserts userland file existence **only for `workers`**; for auth
   it asserts **ZERO** files. Auth boots purely from the JSR dep + CLI config (appsettings,
   `netscript.config.ts`, `deno.json` imports) + env vars, validated by HTTP health probes
   (`/health/live`, `/health/ready`, `/api/v1/auth/session`). No gate requires any auth userland file.

### Decision (locked)

Auth emits **exactly ONE userland artifact**: `auth/mod.ts` — a barrel re-exporting the published
auth v1 contract surface (`@netscript/plugin-auth-core/contracts/v1`: `AUTH_SESSION_STATES`,
`AuthSessionResponseSchema`, `AuthUserResponseSchema` + the v1 response types). This is the single
seam a user owns and extends to build auth-aware app handlers/UI. It imports **only** the published
runtime core (never plugin internals), so it is dependency-direction clean and interpolation-free.

- **Why a barrel and not empty:** the brief's decision rule expects "(1) a wiring barrel"; every other
  plugin emits a `<pluginDir>/mod.ts`, so this keeps the house pattern consistent and gives the user a
  real typed seam. The "prefer SMALLER surface" rule is honored by emitting **no sample leaf** (auth
  backends are env-selected, not code-authored on the common path) — one file, not two.
- **Why no `deno.json`:** D-CONFIG-KEEP — the CLI owns `deno.json`/appsettings/`netscript.config.ts`
  wiring (it inserts the `@netscript/plugin-auth-core` JSR imports + the appsettings + config entry).
- **Why no `.prisma`:** D-PRISMA (above). `databaseMigrationsAdded: false`, asserted with rationale.
- **Why no plugin source:** D-NOCOPY — `services/`, `src/`, `streams/`, the plugin
  `mod.ts`/`deno.json`/manifest all resolve from `jsr:@netscript/plugin-auth`.

## Files

**Created:** `plugins/auth/src/scaffold/spec.ts` (data-only: `authManifestSpec` migrated **verbatim**
from the retired `authSpec` fixture, `AUTH_RUNTIME_CORE_SPECIFIER`, `AUTH_SAMPLE_WORKSPACE`,
`AuthSampleStub`, `AUTH_SAMPLE_STUBS` text-importing the barrel), `src/scaffold/scaffolder.ts`
(`buildArtifacts`), `src/scaffold/stubs/mod.ts` (the real type-checked `auth/mod.ts` barrel stub),
`src/scaffold/scaffold.test.ts` (6 tests).

**Rewritten:** `plugins/auth/src/scaffold/mod.ts` (121 LOC of local redecls/runner → ~28 LOC
`createPluginScaffold` compose), `plugins/auth/scaffold.ts` (local-runner re-export → shared
`runScaffoldCli({ entrypoint: scaffold })`), `plugins/auth/deno.json` `check` task (added
`src/scaffold/stubs/mod.ts`).

**Deleted:** `src/scaffold/artifacts.ts`, `src/scaffold/files.ts`, all 26
`src/scaffold/templates/**` (the entire dir).

**test_fixtures retirement:** deleted `packages/plugin/src/scaffold/test_fixtures/manifest-specs.ts`
(and its now-empty `test_fixtures/` dir); rewrote `packages/plugin/src/scaffold/manifest-spec.test.ts`
to drop the obsolete aggregate byte-identity loop (every plugin now owns its byte-identity test in
`plugins/<kind>/src/scaffold/scaffold.test.ts`) while preserving the two `buildScaffoldPluginJson`
unit tests (version/peer injection + trailing newline) via a minimal inline spec — **no package →
plugin import** introduced, S1 package stays green.

## Gates (raw)

| gate | command | result |
| --- | --- | --- |
| check | `run-deno-check.ts --root plugins/auth --root packages/plugin --ext ts,tsx` | 155 files, `totalOccurrences:0`, exit 0. |
| lint | `run-deno-lint.ts --root plugins/auth --root packages/plugin --ext ts,tsx` | 155 files, `totalOccurrences:0`, exit 0. |
| fmt | `run-deno-fmt.ts --root plugins/auth --root packages/plugin --ext ts,tsx` | 155 files, `findings:0`, exit 0. |
| test | `deno test --allow-all --unstable-kv plugins/auth packages/plugin` | `60 passed | 0 failed` (incl. 6 new auth scaffold tests + rewritten S1 unit tests). |
| publish (authority) | `deno publish --dry-run --allow-dirty` (`plugins/auth`) | `Success Dry run complete`, exit 0. Tarball ships `src/scaffold/{mod,scaffolder,spec,stubs/mod}.ts` + `database/auth.prisma`; no `templates/**`/`artifacts.ts`/`files.ts`. Pre-existing non-blocking `unanalyzable-dynamic-import` warning in `services/src/main.ts` (untouched). |
| scaffold versions | `deno task check:scaffold-versions` | `E-12 OK — 10 scaffold pin(s) are stable`, exit 0. |
| lock churn | `git status --porcelain deno.lock` | empty (no churn). |

### Byte-identity outcome

`buildScaffoldPluginJson(authManifestSpec, '0.0.1-alpha.12')` reproduces the committed
`plugins/auth/scaffold.plugin.json` byte-for-byte (asserted, green). The verbatim spec migration is
proven byte-faithful.

### Pre-existing debt (NOT fixed in S2c — for S4)

Doctrine FAILs outside this changeset remain (e.g. the auth CLI-command A4 abstract-base-class
pattern, analogous to workers' `FAIL A4 abstract class WorkersCliCommand`). Out of scope for the
scaffolder thinning slice; recorded for S4.

## Constraints honored

- No new casts (2 sanctioned untouched); no `any`. Dependency direction clean (the barrel imports
  only `@netscript/plugin-auth-core/contracts/v1`; scaffolder imports only `@netscript/plugin*`).
- Staged explicit paths only (never `git add -A`). Did not touch any other plugin or `packages/cli`.
  No `deno.lock` churn. No push, no PR.

## S2 status

**S2 is COMPLETE across all 5 official plugins** — workers (S2a), sagas/triggers/streams (S2b), auth
(S2c). Every plugin now uses the thin `createPluginScaffold` composition over
`@netscript/plugin/scaffold`, emits userland-only glue, and owns its byte-identity test in-package.
The central `test_fixtures/manifest-specs.ts` is fully retired.
