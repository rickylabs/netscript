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
confirmed, all three generated asset layers are refreshed, and the complete first evidence pass is
green at `8771c8050`.

## Completed

- Re-baselined the assignment against live `origin/main` twice after an upstream advance.
- Diagnosed each parser failure and inspected every export target with `deno doc --json`.
- Made the bounded source-page and mapping edits.
- Ran the targeted drift gate successfully before rebase.
- Rebased cleanly and regenerated prose → asset barrel → publish assets in order (all exit 0).
- Ran all required gates at `8771c8050`; every required gate exited 0 and post-gate status was
  exactly empty.
- Reproduced the known `check:mcp-export-corpus` exit 1 independently at clean `origin/main`.

## Next Steps

1. Commit this gate ledger and repeat the complete required set at that final head.
2. Mark the PR ready before first push, push explicitly, create/update metadata, and leave
   `status:impl` for the supervisor.

## Key Decisions

- The three symbol policies are `entrypoints-only`; exact measured gaps are recorded in research.
- No closing keyword and no lifecycle transition beyond `status:impl`.

## Files Changed

- Three source reference pages, `.llm/tools/docs/check-exports-drift.ts`, this run directory, and
  the generated prose bundle, CLI asset barrel, and MCP publish asset.

## Gates

- Complete generated-head pass: all required gates PASS; final-head repetition pending after the
  evidence commit.

## Drift and Debt

- Drift: main advanced through #1860; inspected and scheduled for normal rebase.
- Debt: none created, deepened, or closed.

## Commits

- See the PR commit list and per-slice comment after the slice is pushed.
