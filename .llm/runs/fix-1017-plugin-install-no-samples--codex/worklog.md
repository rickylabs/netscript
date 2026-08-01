# Worklog: `plugin install --no-samples`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Archetype | `6 — CLI / Tooling` with affected Archetype 5 connectors |
| Scope overlays | `none` |

## Design

### Public Surface

- Public command remains `netscript plugin install <kind> --no-samples`.
- `DispatchPluginScaffoldOptions.includeSamples` carries the internal CLI boundary value.
- `InstallStarterResource` gains one optional, documented samples policy exported from
  `@netscript/plugin/adapter`; undefined retains emit-all behavior.

### Domain Vocabulary

- `includeSamples` — boolean install intent serialized into `ScaffolderContext.options`.
- starter samples policy — discriminates omit-on-no-samples from alternate structural input.
- empty barrel input — a plugin-owned structural fallback that emits a valid module with no sample exports.

### Ports

- Existing `ProcessPort` remains the subprocess seam; no new port is introduced.
- Existing `FileSystemPort` remains the adapter write seam; no new port is introduced.

### Constants

- Exact forbidden sample paths are a single E2E constant/list containing the six issue paths.
- Existing default starter inputs remain the canonical sample-enabled values.

### Archetype 6 Surface Inventory

- Existing spine abstracts and command composition are untouched.
- Vertical feature: `public/features/plugins/install` plans and dispatches install.
- Adapter boundary: `public/features/plugins/dispatch` serializes plugin scaffold context.
- Extension axis: plugin starter resources, declared by `@netscript/plugin/adapter` and populated by each connector.
- Permission and command vocabularies are unchanged.

### Archetype 5 Connector Inventory

- workers composes job/task resources plus barrel/runtime glue from core adapter primitives.
- sagas composes saga resource plus barrel/runtime glue.
- triggers composes webhook/scheduled/file-watch resources plus barrel/runtime glue.
- streams composes stream resource plus barrel.
- No core/sibling contracts are redefined.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Prove no-samples crosses the official-plugin boundary and yields valid sample-free workspaces for all four plugins. | scoped check/lint/format, adapter + CLI tests, quality gate, exact-path E2E, one scaffold.runtime run | listed production/test/E2E files plus run artifacts |

### Deferred Scope

- Other scaffold options and starter-resource lifecycle redesign — unrelated to #1017.
- Existing doctrine debt — unchanged.

### Contributor Path

Plugin authors classify sample-only starters in `src/adapter/plugin.ts`; if a structural starter
references samples, they provide its no-samples input there. The core adapter interprets that policy,
while the CLI only serializes the boolean install intent.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | research/design | Cause verified; four barrel hazards confirmed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Empty structural barrels under no-samples | Prevent dangling exports while retaining workspace structure. | code inspection / plan D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| All four barrels, not only workers, reference samples. | minor | yes |

## Gate Results

Not run before PLAN-EVAL.

## Handoff Notes

- PLAN-EVAL should inspect D2/D3 and verify the public-policy surface is the minimum needed for valid barrels.

