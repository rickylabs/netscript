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

Complete pass at generated-assets head `8771c8050`:

| Command | Exit |
| --- | ---: |
| `deno task docs:exports-drift` | 0 |
| `deno task --cwd docs/site check:source-format` | 0 |
| `deno task --cwd docs/site build` | 0 |
| `deno task --cwd docs/site check:links` | 0 |
| `deno task --cwd docs/site check:caveats` | 0 |
| `deno task docs:links` | 0 |
| `deno task docs:accuracy` | 0 |
| `deno task docs:snippets` | 0 |
| `deno task check:agent-docs-prose` | 0 |
| `deno task check:assets-barrel` | 0 |
| `deno task check:publish-assets` | 0 |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 |
| `git diff --check $(git merge-base origin/main HEAD) HEAD` | 0 |
| `git diff --quiet origin/main -- deno.lock` | 0 |
| `git merge-base --is-ancestor f63ad94e9 HEAD` | 0 |
| Current-main mapping-name retention (29 upstream, 32 current, 0 missing) | 0 |
| `git status --porcelain` | 0; exact output empty |

The same complete required set is repeated after this evidence commit so the PR validation table
describes the final pushed head.

Known baseline reproduced independently in detached clean worktree
`/tmp/netscript-mcp-baseline-cKV1zC` at `origin/main` `b66e52cbc`:
`deno task check:mcp-export-corpus` exited 1 with “MCP export-surface corpus is stale”; worktree add
and removal both exited 0. This matches #1668 and is not attributed to this branch.

## PLAN-EVAL

`N/A` — mechanical adoption with a complete, falsifiable contract and explicit gate set.

## Handoff Notes

- IMPL-EVAL must independently verify the three export maps, parser-visible rows, coverage counts,
  cumulative mapping retention, docs-only scope, generated assets, and final-head exit codes.
