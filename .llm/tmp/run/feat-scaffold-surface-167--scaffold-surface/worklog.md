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
