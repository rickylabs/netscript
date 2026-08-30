# Worklog: CLI and plugin subpath reference surfaces

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-cli-plugin-subpath-surface--1788` |
| Branch | `docs/cli-plugin-subpath-surface` |
| Archetype | 6 — CLI/tooling described; plugin package surface inspected |
| Scope overlays | docs |

## Design

### Public Surface

- `@netscript/cli/scaffolding` and `@netscript/cli/testing` documentation.
- Twelve `@netscript/plugin/*` subpath inventories from `packages/plugin/deno.json`.

### Domain Vocabulary

- Entrypoint symbol set — names in the entry module's `deno doc --json` `symbols` array.
- Owned symbol — declaration originates in the section's source area and needs a local description.
- Re-export — declaration originates in a root or already documented surface and is named without
  duplicating its description.

### Ports

- None. This docs-only slice consumes source and generator contracts without adding abstractions.

### Constants

- None introduced. Export maps and `deno doc` output are the finite source of truth.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Correct and complete CLI subpath accounting; bootstrap run evidence | CLI source-format/build and symbol comparison | CLI page and run artifacts |
| 2 | Refresh CLI-page derived corpus | Generated-asset checks and provenance equality | Four generated docs assets only |
| 3 | Complete plugin subpath accounting without duplicating covered symbols | Plugin symbol comparison plus docs gates | Plugin page and updated run artifacts |
| 4 | Refresh final derived corpus | Full requested gate set and provenance equality | Four generated docs assets only |

### Deferred Scope

- `AUTHORITATIVE_MAPPING` complete-mode adoption and database ledger work remain later #1777 slices.
- Source defects, if found, become separately filed issues and are not fixed here.

### Contributor Path

Read each package's `deno.json` export map, run `deno doc --json` on the entrypoint, then update the
matching section with owned symbols and explicit re-export notes before regenerating docs assets.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | bootstrap | research | Branch/baseline/issues/export maps/pages/generator chain re-derived. |
| 2026-08-30 | plan | design | Four commit slices locked; source comparison resolved plugin coverage and one-PR sizing. |
| 2026-08-30 | 1 | implementation | Corrected the nonexistent-page claim, documented `CacheBackendChoice`, and named testing re-exports. CLI accounting is 23/23 scaffolding and 29/29 testing. |
| 2026-08-30 | 1 | gate | `check:source-format` exited 0. RTK was unavailable, so the authoritative rerun was direct. |
| 2026-08-30 | 1 | reconcile | #1788 remains open at `status:impl`, milestone 0.0.7; #1777 remains reference-only. No scope or metadata adjustment needed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `PLAN-EVAL: N/A` | The issue supplies the complete contract and gates; deterministic source comparison resolved the only judgment call before implementation, leaving no architecture or sequencing trade-off. | Issue #1788, `research.md`, `plan.md` |
| One PR | Two-page docs-only repair with shared provenance/gates remains coherent and reviewable. | D1 in `plan.md`; `drift.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Plugin page is partially, not uniformly, summarized | minor | yes |
| One PR selected after measured sizing | minor | yes |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| CLI source format | `deno task --cwd docs/site check:source-format` | PASS (exit 0) | Direct rerun after unavailable RTK proxy. |
| CLI symbol accounting | `deno doc --json` for both CLI subpaths compared with page symbols/re-export notes | PASS (exit 0) | 23/23 scaffolding; 29/29 testing. |

Remaining gates are `NOT_RUN` until the plugin page and final generated assets are complete.

## Handoff Notes

- Evaluator should independently enumerate all 14 subpath entrypoints and verify section re-export
  lists, then confirm generated provenance and the unchanged package source/lock/mapping boundaries.
