# Worklog — W5-V3 plugin remove

## Design

### Public surface and command contract

- Command: `netscript plugin remove <configured-name>`; `--pkg` remains an explicit override.
- Library flow: `removePlugin(input, dependencies)` gains a preflight removal-plan boundary but no
  new package export.
- Output remains completion counts; failures use removal vocabulary.

### Archetype-6 spine and layer-2 abstracts

- Existing spine: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`.
- No new layer-2 abstract is introduced. The existing remove feature is one vertical command/use
  case; a speculative pipeline hierarchy is not justified.

### Domain vocabulary

- `PluginRemovalPlan`: validated package identity plus owned cleanup paths.
- `ProjectPathSnapshot`: absent/file/directory pre-command state.
- `PluginRemovalRollbackError`: removal failure with rollback context if restoration also fails.

### Ports and adapters

- `FileSystemPort`: read/write/walk/remove/create for snapshots and restoration.
- `PluginDispatchPort` + `ProcessPort`: plugin-owned remove dispatch.
- `PluginWorkspaceMutator`: appsettings and NetScript config cleanup.
- Existing scaffolder/template ports: Aspire helper regeneration.

### Constants

- Existing `SCAFFOLD_DIRS`, `SCAFFOLD_FILES`, and plugin alias/package resolver constants remain
  authoritative. No new hardcoded plugin-name switch is introduced.

### Extension axes and vertical feature catalog

- Existing registries are unchanged (`PluginKindRegistry`, `DbEngineRegistry`,
  `TemplateRegistry`, deploy registries via `kernel/extension-points.ts`).
- Relevant feature path:
  `src/public/features/plugins/remove/{remove-plugin-command.ts,remove-plugin.ts}`.
- Composition remains in public/local plugin groups; only dependencies are wired there.

### Generated outputs and semantic strategy

- Owned outputs: configured plugin directory, `.netscript/generated/<name>`,
  `.netscript/generated/plugin-<name>`, DB `schema/plugins/<name>` roots, appsettings,
  `netscript.config.ts`, and regenerated Aspire/reference wiring.
- RED test asserts the verifier's half-removed state on baseline.
- Rollback test injects a failure after mutation starts and compares the owned tree byte-for-byte.
- Lifecycle test invokes the public CLI command tree, then runs doctor and compares owned pre/post
  state semantically rather than snapshotting giant generated strings.

### Permissions and composition

- No new permission class: existing `--allow-read`, `--allow-write`, and `--allow-run=deno` cover
  preflight, cleanup, rollback, and dispatch.
- Top-level command lists remain owned by existing public/local composition; no inline command body
  is added to composition.

### Commit slices

See `plan.md` S0–S4. Each slice updates this worklog and `context-pack.md` before commit.

### Deferred scope and contributor path

- Third-party custom uninstall hooks are deferred until a signed/static protocol exists.
- To add another owned cleanup surface, add it to removal planning, ensure it is snapshotted before
  mutation, and extend the semantic lifecycle assertion. Package-resolution changes belong in the
  existing plugin package resolver, not a command-local alias switch.

## Evidence

| Phase | Status | Evidence |
| --- | --- | --- |
| Research / plan | complete | Live #1236, doctrine/debt, and focused code inspection recorded. |
| PLAN-EVAL | composed | `plan-eval.md`; milestone-run + D6 row. |
| S1 RED | expected failure | `deno test --unstable-kv -A packages/cli/src/public/features/plugins/remove/remove-plugin_test.ts` exited 1. The diff showed `Plugins.sagas-api` and `BackgroundProcessors.sagas` had become empty after dispatch failure; the later assertion also requires dispatch package `@netscript/plugin-sagas`, while baseline sends `sagas`. |

## Reconcile notes

- S0: issue #1236 is open, milestone 0.0.5, with required type/area/priority labels and
  `status:triage`; draft PR will move the single lifecycle label to `status:plan-eval`.
- S1: issue/PR now carry `status:plan-eval`; no new reviewer comments. RED failure is the verified
  defect, not an infrastructure failure. Main advanced by unrelated MCP PR #1233 after bootstrap;
  no touched-path overlap, so implementation continues and will rebase before ready if required.
