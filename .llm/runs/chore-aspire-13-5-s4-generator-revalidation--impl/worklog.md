# Worklog: Aspire 13.5 generator re-validation (S4)

## Run Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `chore-aspire-13-5-s4-generator-revalidation--impl`                          |
| Branch         | `chore/aspire-13-5-s4-generator-revalidation`                                |
| Archetype      | `6 — CLI / Tooling` (config contract folded; deploy seam checked against A7) |
| Scope overlays | none                                                                         |

## Design

### Public Surface

- `AspireConfigSchema` — same exported schema; documented `appHost` default changes.
- Generated `.helpers/*.mts` — same SDK member calls; only stale explanatory comments/derived asset
  text change.
- `DeployTargetPort` implementations — same operations; 13.5 argv behavior becomes explicitly pinned
  by tests.
- Command surfaces and export maps do not change.

### Domain Vocabulary

- SDK member verdict — `unchanged | changed | removed`; all 13.5 rows currently `unchanged`.
- Deploy command contract — `publish | deploy | destroy` plus supported long options.
- Aspire AppHost path — modern TypeScript entrypoint `./aspire/apphost.mts`.
- Spine abstracts: current tree contains `CliCommand<TDefinition>`, `CliRoot<TDefinition>`,
  `UseCase<TInput, TResult>`, and `Registry<TKey, TValue>`; the profile’s fifth `CliCommandGroup`
  spine is absent on the baseline and is not introduced or deepened here.
- Existing layer-2 abstracts are unchanged: `Pipeline`, `PipelineStep`, `Manifest`,
  `ScaffoldCommand`, and `DeployStepCommand`; this slice introduces none.

### Ports

- `ProcessPort` — existing external CLI seam used by both Aspire deploy adapters.
- Existing `FileSystemPort`, `TemplatePort`, `PromptPort`, `LoggerPort`, and
  `RuntimeConfigStorePort` remain unchanged.
- No new port or adapter is introduced.

### Constants

- No new source constant group. Finite SDK members and deploy verbs are recorded as data in
  `member-table.md`; existing adapter/domain constants remain authoritative.

### CLI structure checkpoint

- Public vertical features: `agent`, `config`, `contracts`, `db`, `deploy`, `generate`, `init`,
  `marketplace`, `plugins`, `root`, `services`, and `ui`; the slice changes no feature catalog or
  command.
- Extension axes: `PluginKindRegistry`, `DbEngineRegistry`, `TemplateRegistry`,
  `OutputRendererRegistry`, `PresetRegistry`, and `DeployTargetRegistry`, populated at existing
  composition roots and listed in `kernel/extension-points.ts`; none changes.
- Composition declarativity: existing `createPublicCli`/`createMaintainerCli` files remain the
  wiring owners; no composition file changes.
- Permission requirements: no new permission; deploy adapters continue through `ProcessPort`.

### Commit Slices

| # | Slice                                                        | Gate                                                                                     | Files                                                      |
| - | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1 | Prove the 13.5 SDK member surface and bootstrap the run      | sourced table review; format                                                             | run-dir artifacts including `member-table.md`              |
| 2 | Prove the modern AppHost default and existing #1371 coverage | focused config test + `generate-register-background_test.ts`                             | config schema/test; run artifacts                          |
| 3 | Prove 13.5/S12 upstream anchors and debt gate                | stale-anchor grep + focused generator/asset checks                                       | two comments, debt entry, run artifacts                    |
| 4 | Prove the exact 13.5 deploy argv contract                    | two deploy adapter test files                                                            | adapters/tests as needed; `member-table.md`; run artifacts |
| 5 | Prove regenerated assets and all local gates                 | asset freshness, wrappers, quality, arch, generator tests, JSR audit, `scaffold.plugins` | generated asset plus final run artifacts                   |

### Deferred Scope

- `addDenoApp` adoption — S12/0.0.8 after restore/runtime proof.
- Health/port/resource-command emission — S5/S6/S8.
- Local Aspire runtime — no lease; CI `scaffold.runtime` owns the verdict after ready.
- IMPL-EVAL/ready transition — separate Fable supervisor/evaluator session.

### Contributor Path

To add or update an Aspire emission, start at the relevant generator under
`kernel/templates/aspire/helpers`, add a semantic colocated test, regenerate the typed asset barrel
when a `.template` changes, then run the scoped generator and scaffold consumer gates. New deploy
variants register through `DeployTargetRegistry`; new templates enter the existing asset
manifest/generator flow rather than a new barrel.

## Plan-Gate

`PLAN-EVAL: N/A` — #1716, the ratified D-4/D-15 plan, S2 runtime receipts, and the #1728 baseline
fully specify the five bounded slices and their gates. No architecture, sequencing, or scope
decision remains open.

## Progress Log

| Time       | Slice | Step            | Notes                                                                         |
| ---------- | ----- | --------------- | ----------------------------------------------------------------------------- |
| 2026-08-30 | 1     | research/design | Re-baselined at `8b1e42f72`; member pages and S2 receipts reviewed.           |
| 2026-08-30 | 1     | push command    | `git push origin HEAD:refs/heads/chore/aspire-13-5-s4-generator-revalidation` |

## Decisions

| Decision                     | Reason                                                              | Source                               |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| No SDK emission-shape change | All names remain and S2 proves the options-object health signature. | `member-table.md`, S2 receipt 01     |
| `--yes` only for destroy     | Only destroy help advertises it.                                    | S2 V12 receipts                      |
| #1371 coverage check only    | #1728 already landed the required emitted-module test.              | baseline test and closed issue #1371 |

## Drift

| Drift                                                                                     | Severity | Logged in drift.md |
| ----------------------------------------------------------------------------------------- | -------- | ------------------ |
| #1716/epic still say S4 closes #1371, but #1728 already closed it before branch baseline. | minor    | yes                |
| Fable 5 supervisor is an owner-specified route override from default Opus orchestration.  | minor    | yes                |

## Gate Results

All implementation gates are `NOT_RUN` until their owning slice lands.

## Handoff Notes

The separate evaluator should inspect `member-table.md`, the exact deploy argv assertions, the
single edited debt entry, asset-barrel freshness, and the final structured gate evidence first.
