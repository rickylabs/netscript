# Worklog: #1356 UI app-root resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/cli-1356` |
| Branch | `fix/ui-commands-resolve-app-root` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### PLAN-EVAL

`PLAN-EVAL: N/A` — the live issue supplies a complete resolution order, five-command surface,
ambiguity/error contract, corrected-gate contract, negative controls, docs expectations, and scope
boundaries. The existing composition/port seams make this mechanical; no deferred decision would
force rework.

### Public Surface

- `ui:init`, `ui:add`, `ui:list`, `ui:update`, `ui:remove` gain `--app <name>`.
- `--project-root <path>` continues to accept an explicit app path.
- `UiAddCommandInput` describes `route`, `island`, `query`, and `app`.
- No package export-map or `mod.ts` change.

### Domain Vocabulary

- `UiAppRootInput` — optional explicit app path and optional named app.
- `UiAppCandidate` — direct `apps/<name>` workspace member with deterministic name/path.
- `UiAppRootResolver` — injected shared command resolver.

### Ports

- Existing `FileSystemPort` — reads root `deno.json`; no new port.
- Injected cwd/path/workspace-root functions — retain host and filesystem test seams.

### Constants

- Existing `ASPIRE_RESOURCE.APP` — E2E default app identity (`dashboard`).
- No new finite vocabulary requires a registry or constant family.

### Archetype-6 Existing Spine / Axes

- Spine unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced; therefore no new concrete-pair justification is required.
- Vertical feature catalog touched: public `ui/{init,add,list,update,remove}` only.
- Extension axes unchanged: template, preset, DB engine, plugin kind, deploy target, and output
  renderer registries are not modified.
- Composition declarativity remains in `public/features/root/public-command-tree.ts`; it only wires
  the new resolver dependency.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Research/design + PLAN-EVAL N/A | artifact review | run directory |
| 1 | Shared app resolution, five commands, public input, corrected E2E discriminator | focused tests + help + scoped/quality/arch gates | owned CLI/UI/E2E files + run artifacts |

### Deferred Scope

- Full `scaffold.runtime` — owner/CI only; no serialized token granted.
- Dynamic app naming/content and new page flags — linked sibling issues.

### Contributor Path

Add a UI subcommand under `public/features/ui/<verb>`, expose the shared `--app` and
`--project-root` options, resolve through the injected UI app-root resolver, and add it to the
cross-command help/destination tests. E2E assertions run from `apps/${ASPIRE_RESOURCE.APP}`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-09 | 0 | bootstrap | Clean branch at `origin/main@1395f3989`; live issue and doctrine re-baselined. |
| 2026-08-09 | 0 | PLAN-EVAL | N/A recorded before implementation; mechanical contract, mandatory IMPL-EVAL retained. |
| 2026-08-09 | 0 | Tier-D identity | Thread id recorded; runtime controller reported `missing_identity` exit 3, so no daemon/mobile claim. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Direct `apps/<name>` candidates | Matches generated workspace and issue contract | issue #1356; scaffold plan |
| Ambiguity is an error | Prevents silent writes | acceptance row 4 |
| E2E app constant | Avoids duplicating default name | `ASPIRE_RESOURCE.APP` |

## Gate Results

All implementation gates are `NOT_RUN` until slice 1.

## Handoff Notes

- IMPL-EVAL must independently inspect the pre-fix RED transcript, row-4 real exit/candidate list,
  five help surfaces, and scratch old-layout E2E discriminator.
- Do not accept local green gates as Tier-D self-certification.

