# Context Pack: plugin scaffolding reference correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-scaffolding-invents--1857` |
| Branch | `docs/plugin-scaffolding-invents-fix` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` (docs-only) |
| Scope overlays | `docs` |

## Current State

Both source pages now name the real `/scaffold` subpath and no longer contain the fabricated
`/scaffolding` sections. Run artifacts are instantiated; regeneration and gates remain.

## Completed

- Re-baselined all three defect confirmations against `origin/main`.
- Inspected both `scaffold.ts` entrypoints with `deno doc --json`.
- Made the bounded source-page edits.

## Next Steps

1. Regenerate agent-doc prose, the asset barrel, and publish assets in order.
2. Commit, run every required gate at the committed head, and record real exit codes.
3. Obtain separate-session IMPL-EVAL and leave lifecycle status at `status:impl` for the supervisor.

## Key Decisions

- The real export gets a concise table row, not a repetitive detail section.
- No closing keyword and no `AUTHORITATIVE_MAPPING` change.

## Files Changed

- Two docs source pages and this scoped run directory; generated files will be added after regeneration.

## Gates

- Pending.

## Drift and Debt

- Drift: none.
- Debt: none created, deepened, or closed.

## Commits

- See the PR commit list and per-slice comment after the slice is pushed.
