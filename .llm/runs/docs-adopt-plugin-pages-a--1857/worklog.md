# Worklog: deployable-plugin reference adoption slice A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-a--1857` |
| Branch | `docs/adopt-plugin-pages-a` |
| Archetype | `5 - Plugin Package` (documentation-only surface alignment) |
| Scope overlays | `docs` |

## Design

### Public Surface

- Documentation only: all real entrypoints for `@netscript/plugin-sagas`,
  `@netscript/plugin-streams`, and `@netscript/plugin-ai`.

### Domain Vocabulary, Ports, and Constants

- No new code vocabulary, ports, or constants. Package names, export specifiers, and paths come
  directly from the three existing `deno.json` export maps.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Make three reference pages parser-visible and add evidence-backed mappings | `deno task docs:exports-drift` plus required docs/generated-asset gates | three source pages, checker mapping, generated assets, run artifacts |

### Deferred Scope

- Complete symbol inventories, plugin-auth, the auth hub exclusion, and all other #1857 work.

### Contributor Path

Future page adoption starts at the package's `deno.json`, measures every target with
`deno doc --json`, compares the union with `parseDocContent().docSymbols`, then adds a truthful
mapping without removing any current-main row.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | Research | Confirmed 14/7/7 export maps, diagnosed the distinct parser failures, and measured 236/55/88 symbol unions with 56/33/24 documented real exports. |
| 2026-09-01 | 1 | Edit | Corrected headings/row structure and inserted only the three requested mapping blocks. |
| 2026-09-01 | 1 | Reconcile | `origin/main` advanced from `3b6386e14` to `b66e52cbc` via #1860; inspected the incoming diff and retained every upstream mapping name. |
| 2026-09-01 | 1 | Regenerate | Rebased cleanly, then ran prose → asset barrel → publish assets in the required order; all three generators exited 0. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| All mappings are entrypoints-only | Each page has measured real omissions; complete mode would misrepresent the current reference. | `deno doc --json` union and parser comparison |
| Streams receives a new table | Its recognized heading contains no package/path rows, unlike the other two pages' hidden valid tables. | `parseDocContent()` row regex and source page |

## Drift

- Minor: `origin/main` advanced during implementation; recorded in `drift.md` and resolved by a
  normal rebase before generation.

## Gate Results

- Pre-rebase targeted gate: `deno task docs:exports-drift` exited 0 with all three mappings active.
- The complete required set will run at the generated-assets commit, then repeat after the final
  evidence commit so the PR table describes the pushed head.

## PLAN-EVAL

`N/A` — mechanical adoption with a complete, falsifiable contract and explicit gate set.

## Handoff Notes

- IMPL-EVAL must independently verify the three export maps, parser-visible rows, coverage counts,
  cumulative mapping retention, docs-only scope, generated assets, and final-head exit codes.
