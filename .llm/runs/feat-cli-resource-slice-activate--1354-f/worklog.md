# Worklog: Slice F activation (#1354)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-activate--1354-f` |
| Branch | `feat/cli-resource-slice-activate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | frontend consumer output; runtime/hosted excluded |

## Design

### Public Surface

- `generate resource` becomes the fourth child of the public `generate` command group.
- Init's service example becomes a fixed caller of the same neutral resource-slice planner with `form` and `partial`.

### Domain Vocabulary

- `NormalizedResourceSliceInput`, `ResourceSlicePlan`, `ResourceSlicePlannedLeaf` — existing planner contract.
- `SelectedResourceClient`, `SelectedResourceProcedure` — existing selection/binding contract.
- Canonical role — planner leaf role used to compare init and command output independent of target root.

### Ports

- Existing `FileSystemPort`, `TemplatePort`, app-root/client/procedure resolver functions, `ResourceSliceStager`, and `GeneratedSourceFormatterPort`; no new port.
- Existing five Archetype-6 spine abstracts remain `CliCommand`, `CliCommandGroup`, `CliRoot`, `UseCase`, and `Registry`; this slice adds no abstract or registry.

### Constants

- Existing `RESOURCE_SLICE_VARIANTS` and `TEMPLATE_KEYS`; no parallel finite vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| F | Converge init, retire complete old authority, compose and register command, regenerate carriers/corpus | focused tests + complete Slice F gate set | locked 32-file enumeration; generated carriers exempt |

### Extension Axes and Composition

- Existing registries (plugin kind, DB engine, deploy target) are unchanged.
- Public composition remains declarative: `createGenerateCommand` receives one composed dependency graph and registers the resource command as its fourth child.
- No layer-2 abstract is introduced; therefore R-BASE-L2 requires no new concrete pair.

### Semantic Test Strategy and Consumer Impact

- Compare canonical planner roles byte-for-byte between init and command-shaped rendering.
- Instrument scaffold write order to prove Fresh derivation follows route emission and that no seed writer remains.
- Assert exact command/help visibility and execute through composed dependencies.
- Validate generated applications statically only; hosted runtime acceptance belongs to Slice G.

### Deferred Scope

- Slice G documentation/hosted acceptance and D3 crash/concurrency deferrals remain unchanged.

### Contributor Path

Change a canonical resource leaf under `kernel/assets/resource-slice/` and its planner/renderer contract; both init and `generate resource` consume that one authority. Add command variants through the existing resource feature, not the init writer.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | F | Bootstrap | Clean branch at `be3e3dded`; locked plan read; retire-set census found no additional importer or rendered consumer. |
| 2026-09-02 | F | Plan gate | `PLAN-EVAL: N/A` — owner supplied a locked, already evaluated plan and explicitly directed N/A for this implementation run. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Retain only service-query/README/telemetry demo additions in the example writer. | Every canonical role must come from the neutral planner. | locked Slice F / D4 |
| Treat generated carriers as ceiling-exempt freshness output. | They are mechanical projections, not authored scope. | owner/doctrine contract |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` binary is unavailable. | minor | yes |
| Stacked base branch advanced after integration commit. | minor | yes |

## Gate Results

Pending implementation.

## Handoff Notes

- Evaluator should first inspect retire-set completeness, planner equivalence, Fresh derivation order, and composed command dependencies.

