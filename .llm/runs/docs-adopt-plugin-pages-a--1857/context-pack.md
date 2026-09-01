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
symbol coverage. Current-main mapping retention is confirmed; rebase and generation are next.

## Completed

- Re-baselined the assignment against live `origin/main` twice after an upstream advance.
- Diagnosed each parser failure and inspected every export target with `deno doc --json`.
- Made the bounded source-page and mapping edits.
- Ran the targeted drift gate successfully before rebase.

## Next Steps

1. Commit the implementation/run state and rebase onto `b66e52cbc`.
2. Regenerate prose → asset barrel → publish assets in order.
3. Run and record every required gate at the final committed head.
4. Mark the PR ready before first push, push explicitly, create/update metadata, and leave
   `status:impl` for the supervisor.

## Key Decisions

- The three symbol policies are `entrypoints-only`; exact measured gaps are recorded in research.
- No closing keyword and no lifecycle transition beyond `status:impl`.

## Files Changed

- Three source reference pages, `.llm/tools/docs/check-exports-drift.ts`, and this run directory;
  generated files follow after rebase.

## Gates

- Targeted `docs:exports-drift`: PASS before rebase; full final-head set pending.

## Drift and Debt

- Drift: main advanced through #1860; inspected and scheduled for normal rebase.
- Debt: none created, deepened, or closed.

## Commits

- See the PR commit list and per-slice comment after the slice is pushed.
