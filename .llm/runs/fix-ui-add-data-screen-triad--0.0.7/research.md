# Research — fix-ui-add-data-screen-triad--0.0.7

## Re-baseline

- Carried-in source: issue #1357, recorded at `fac9e339042c`.
- Re-derived against the owner-locked base `de57fab0e220203567367b6852f918dc71f296a6` on 2026-08-30.
  `HEAD`, branch, and merge-base were verified before research and before artifact creation.
- What changed vs the carried-in version:
  - `agent-conventions.ts` advertising moved from cited lines 137–139 to 155–157.
  - #1356 is closed and its app-root work is present. `UiAddCommandInput` now already declares
    `route`, `island`, `query`, and `app`; only the new `dryRun` option is absent.
  - `--force` is present on `ui:add`, but it is passed only to registry installation. Page/island
    scaffolding still hard-refuses existing files and has no dry-run path.
  - All other #1357 source citations remain materially accurate at the locked base.

## Findings

| #  | Finding                                                                                                                                                                                                                                                          | How to verify                                                                                                                             |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | `scaffoldUiPage` emits an inline `createRouteReference`, a `() => ({})` layer, a `useSignal(0)` counter, and `queryLoaders = {} as const`; `scaffoldUiIsland --query` wraps a static div.                                                                        | `packages/cli/src/kernel/application/ui/web-scaffold.ts:15-68` at `de57fab0`                                                              |
| 2  | The command advertises a data-screen triad, but exposes no `--dry-run`; `--force` does not reach either web scaffolder.                                                                                                                                          | `packages/cli/src/public/features/ui/add/add-ui-command.ts:20-74`                                                                         |
| 3  | The generated app tells coding agents to run the same command first.                                                                                                                                                                                             | `packages/cli/src/kernel/templates/app/agent-conventions.ts:155-157`                                                                      |
| 4  | #1354 is open and owns the full named-procedure slice: route sidecar, components, `withResource`, forms, partials, streams, ownership comments, content-compare reruns, state extension, and manifest-derived registration.                                      | `gh issue view 1354 --repo rickylabs/netscript --json state,body`                                                                         |
| 5  | #1360 is open, but its blocker is not an API gap. `IslandQueryOptions` already accepts `initialData` and required `initialDataUpdatedAt`; #1360 owns the two shipped showcase variants and migration note.                                                       | `deno doc --filter IslandQueryOptions packages/fresh/src/application/query/mod.ts`; issue #1360                                           |
| 6  | #1356 is closed. The actual resolver order and `app` option are exercised by `ui-app-root-command_test.ts`, while `UiAddCommandInput` declares every current option.                                                                                             | `packages/cli/src/public/features/ui/add/add-ui-input.ts:1-11`; `packages/cli/src/public/features/ui/ui-app-root-command_test.ts:118-133` |
| 7  | #1355's current consumable seam is an app-local `lib/<service>.ts` created by `netscript service add --name <service> --with-client`; `init --service` renders the same query-factory template in the canonical example's route-local `(_lib)/service-query.ts`. | `client-scaffolder.ts:24-49`; `write-example-service-app-files.ts:50-74`; `service-query.ts.template`                                     |
| 8  | Both current generated service families expose a conventional `list` query with two known input dialects: persistent CRUD (`limit/page/sortBy/sortOrder`) and memory (`limit/offset/search?`).                                                                   | canonical service contracts and the two `service-showcase*.ts.template` assets                                                            |
| 9  | `createNetScriptQueryClient`, factory `.queryOptions`/`.clientKey`, `QueryIsland`, and `useIslandQuery` are already present, so #1357 can emit the complete hydration contract without changing `packages/fresh` or `packages/sdk`.                              | `deno doc` on `@netscript/fresh/query` and `@netscript/sdk/query-client` surfaces                                                         |
| 10 | `scaffoldUiPage`, `scaffoldUiIsland`, and `UiAddCommandInput` are internal to the CLI package rather than exports of `packages/cli/mod.ts`.                                                                                                                      | `deno doc --filter <symbol> packages/cli/mod.ts` exits 1 for each symbol                                                                  |
| 11 | `FileSystemPort` already provides `readFile`, `writeFile`, `exists`, `createDir`, `readDir`, and `walk`; no new port is justified.                                                                                                                               | `deno doc` / focused read of `packages/cli/src/kernel/ports/file-system-port.ts`                                                          |
| 12 | Fresh accepts route-tree helper islands in `routes/**/(_islands)/`; the existing canonical app examples use that layout.                                                                                                                                         | Fresh route helper convention plus `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/`                                       |
| 13 | The generated router deliberately centralizes `appRoutes`; the current tiny generator bypasses it.                                                                                                                                                               | `packages/cli/src/kernel/assets/app/router.ts.template`                                                                                   |
| 14 | Existing help tests assert prose in isolation, and existing web-scaffold tests assert the defective output. There is no shared role contract coupling help to planned files.                                                                                     | `add-ui-command_test.ts`; `web-scaffold_test.ts`                                                                                          |

## Doctrine / archetype checkpoint

- Package: `@netscript/cli`, Archetype 6 (CLI / Tooling), with `SCOPE-frontend` because it emits
  Fresh routes and islands. Doctrine verdict: **Keep — preserve the Archetype-6 kernel/surface
  split**.
- Public surface: the `netscript ui:add` binary command and its help/exit behavior. No `mod.ts`
  library export, dependency, registry, or plugin extension surface changes.
- Layering: the public `features/ui/add` command stays thin; deterministic validation/planning and
  rendering stay in `kernel/application/ui`; all filesystem IO stays behind `FileSystemPort`.
- Spine inventory: `CliCommand<TDefinition>`, `CliRoot<TDefinition>`, `UseCase<Input, Result>`, and
  `Registry<TKey, TValue>` exist. The Archetype-6 ideal `CliCommand<Input, Result>` signature and
  `CliCommandGroup` do not match this legacy package; this leaf does not touch the spine.
- Layer-2 inventory: `DeployStepCommand` has three command concretes; `Pipeline`/`PipelineStep`
  support three deploy flows; `Manifest` supports `TemplateRegistry`. Existing `ScaffoldCommand` has
  only `AddDbCommand`, an out-of-scope pre-existing R-BASE-L2 mismatch.
- Extension axes remain the existing `DbEngineRegistry`, `DeployTargetRegistry`,
  `OutputRendererRegistry`, `PluginKindRegistry`, `PresetRegistry`, `TemplateRegistry`, and public
  `CliCommandRegistry`. #1357 adds no axis.
- Relevant vertical feature catalog: `public/features/ui/{add,init,list,remove,update}`. This leaf
  changes only `ui/add`; it does not create a parallel generator group.
- Fitness focus: F-CLI-1/2 (presentation/application LOC), F-CLI-12/13 (filesystem/process
  boundaries), F-CLI-16/17 (command feature shape), F-CLI-23 (generated output collision),
  F-CLI-24/31 (asset/registry stability), plus F-1/F-15 and SCOPE-frontend generated-app check.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/mod.ts` with `deno doc` filters, package JSR audit, publish
  dry-run, and NetScript JSR specifier check.
- Baseline: all three selected audit commands exit 0. The affected symbols are not public package
  exports; there is no slow-type or isolated-declaration expansion and no version/dependency work.

## Open questions

- None that force implementation rework. PLAN-EVAL must challenge the locked one-binding rule,
  router mutation seam, product path ceiling, and baseline-aware gate promises before S2.
