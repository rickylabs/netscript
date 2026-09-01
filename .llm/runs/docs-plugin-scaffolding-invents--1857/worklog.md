# Worklog: plugin scaffolding reference correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-scaffolding-invents--1857` |
| Branch | `docs/plugin-scaffolding-invents-fix` |
| Archetype | `5 - Plugin Package` (documentation-only surface alignment) |
| Scope overlays | `docs` |

## Design

### Public Surface

- Documentation only: the published `@netscript/plugin-{triggers,workers}/scaffold` specifiers.

### Domain Vocabulary, Ports, and Constants

- No new code vocabulary, ports, or constants. The authoritative names come from the existing export maps and `deno doc`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Align two reference pages and generated assets with the real scaffold exports | Required docs and generated-asset gates | two source pages, generated assets, run artifacts |

### Deferred Scope

- All other omissions and `AUTHORITATIVE_MAPPING` adoption remain in later #1857 slices.

### Contributor Path

Future corrections start at the plugin's `deno.json` export map, inspect the entrypoint with
`deno doc --json`, update the source reference page, then regenerate the three asset layers.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | Research | Reproduced all three defect confirmations and inspected both real scaffold entrypoints. |
| 2026-09-01 | 1 | Edit | Removed fabricated rows/sections and added concise real `/scaffold` rows. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| No scaffold detail section | The row accurately summarizes the same four shared contracts on each plugin; repetition is not proportionate. | `deno doc --json` and plan D1 |

## Drift

- None observed.

## Gate Results

- Pending regeneration and committed-head validation.

## PLAN-EVAL

`N/A` — mechanical correction with a complete, falsifiable contract and explicit gate set.

## Handoff Notes

- IMPL-EVAL must independently verify both export maps, absence of the claimed directories/symbols,
  the docs-only diff, regenerated assets, all recorded exit codes, and the partial `Refs #1857` PR wording.
