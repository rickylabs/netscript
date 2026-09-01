# Context Pack: deployable-plugin reference adoption slice A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-a--1857` |
| Branch | `docs/adopt-plugin-pages-a` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` (docs-only) |
| Scope overlays | `docs` |

## Current State

The three source pages now expose all 14/7/7 real package/path rows to the parser, and the mapping
contains three explicit `entrypoints-only` policies based on measured 56/236, 33/55, and 24/88
symbol coverage. The branch is rebased onto `b66e52cbc`; current-main mapping retention is
confirmed and all three generated asset layers are refreshed.

## Completed

- Re-baselined the assignment against live `origin/main` twice after an upstream advance.
- Diagnosed each parser failure and inspected every export target with `deno doc --json`.
- Made the bounded source-page and mapping edits.
- Ran the targeted drift gate successfully before rebase.
- Rebased cleanly and regenerated prose → asset barrel → publish assets in order (all exit 0).

## Next Steps

1. Commit the generated assets and updated run state.
2. Run and record every required gate, commit its evidence, then repeat at the final head.
3. Mark the PR ready before first push, push explicitly, create/update metadata, and leave
   `status:impl` for the supervisor.

## Key Decisions

- The three symbol policies are `entrypoints-only`; exact measured gaps are recorded in research.
- No closing keyword and no lifecycle transition beyond `status:impl`.

## Files Changed

- Three source reference pages, `.llm/tools/docs/check-exports-drift.ts`, this run directory, and
  the generated prose bundle, CLI asset barrel, and MCP publish asset.

## Gates

- Targeted `docs:exports-drift`: PASS before rebase; full final-head set pending.

## Drift and Debt

- Drift: main advanced through #1860; inspected and scheduled for normal rebase.
- Debt: none created, deepened, or closed.

## Commits

- See the PR commit list and per-slice comment after the slice is pushed.
