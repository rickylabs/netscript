# Plan

## Scope

- Issue: #307, Waves 2 and 4 only.
- Archetypes: Archetype 6 for `packages/cli`; Archetype 5 for first-party plugin packages;
  public-surface doctrine for package barrel/export decisions.
- Deferred: Wave 1 already done, Wave 3 blocked on #305, Wave 5 owner-decision scope.

## Locked Decisions

| Decision                                                                           | Rationale                                                                                                      |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Delete only files with zero importers and no export-map/template/runtime coupling. | Public subpaths and generated/scaffolded entrypoints are package contracts, even when import-grep looks quiet. |
| Keep `fresh-ui` `DataGrid`.                                                        | It is root-exported, tested, documented, and class-coupled to `data-grid.css`.                                 |
| Treat Wave 4 as no-op if tracked count remains zero.                               | There is no tracked `.llm/tmp` content to purge; `.gitignore` already excludes the scratch tree.               |
| Record every Wave 2 verdict in the slice manifest.                                 | Issue #307 explicitly requires DELETE/KEEP evidence per candidate.                                             |

## Commit Slices

| Slice | Proves                                                                  | Files                                                                                                                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W2-A  | Verified stale deletes remove only orphan files.                        | `packages/cli/src/kernel/adapters/deploy/compile/compile.test.ts`, `packages/plugin/src/public/mod.ts`, `packages/plugin-workers-core/src/public/mod.ts`, `packages/telemetry/src/public/mod.ts`, `packages/plugin-streams-core/src/domain/errors.ts`, run artifacts, manifest. |
| W4-A  | `.llm/tmp` tracked-scratch purge is already satisfied on this checkout. | Manifest/worklog only; no tree deletion because tracked count is `0`.                                                                                                                                                                                                           |

## Gates

- Affected package checks/lints:
  - `packages/cli`
  - `packages/plugin`
  - `packages/plugin-workers-core`
  - `packages/plugin-streams-core`
  - `packages/telemetry`
- Affected package tests where present.
- End gates: `deno task check`, `deno task test`.
- Wave 4 spot-check: run one `.llm/tools` script that writes under `.llm/tmp`.

## Risks

| Risk                                   | Mitigation                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| False-positive deletion of public API. | Check `deno.json` export maps, root exports, tests, docs, templates, and class-name coupling before deleting. |
| Hidden scaffold coupling.              | Grep CLI template/assets trees for candidate names before deletion.                                           |
| Lock churn.                            | Do not run cache reloads; inspect status before commit.                                                       |

## Deferred Scope

- No Wave 3 deletes.
- No Wave 5 owner-decision deletes.
- No telemetry restructure beyond deleting its orphan `src/public/mod.ts`.
