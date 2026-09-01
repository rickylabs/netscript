# Plan: adopt sagas, streams, and plugin-ai export reference pages

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-a--1857` |
| Branch | `docs/adopt-plugin-pages-a` |
| Phase | `implement` |
| Target | Three deployable-plugin reference pages and `docs:exports-drift` mapping |
| Archetype | `5 - Plugin Package` (described surface only; no plugin source changes) |
| Scope overlays | `docs` |

## Doctrine and goal

Doctrine A1, A2, and A14 make the published surface and its export/docs audit part of the consumer
contract. The current doctrine verdict is Keep for all three plugins. Make every real entrypoint
parser-visible and place the pages under cumulative drift enforcement without claiming complete
symbol coverage.

## Scope

- Correct only the three source reference pages' export-table structure and stale entrypoint rows.
- Add exactly three cumulative `AUTHORITATIVE_MAPPING` blocks with measured coverage reasons.
- Regenerate the three derived documentation asset surfaces in the prescribed order.
- Preserve and commit this scoped run directory.

## Non-Scope

- Plugin/package source or export maps; checker logic; triggers/workers; plugin-auth and the auth
  hub exclusion; completing the pages' symbol inventories; issue #1857 closure.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Rename sagas and plugin-ai headings to `## Exports`. | This is a parser-recognized heading and preserves the existing tables' meaning. |
| D2 | Add a real seven-row table under streams' recognized heading and correct its stale entrypoint summary. | Streams has no row-shape defect to tweak; it has no package/path rows at all. |
| D3 | Use `entrypoints-only` for all three mappings. | Measured symbol coverage is 56/236, 33/55, and 24/88, so completeness is not honest. |
| D4 | Use `Refs #1857`, never a closing keyword. | This slice is partial step 3A. |
| D5 | Leave lifecycle at `status:impl`. | The external supervisor owns separate-session evaluation and lifecycle changes. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Complete symbol inventories | safe to defer | The mapping reasons name the measured omissions; this slice guarantees entrypoints only. |
| Remaining #1857 slices | safe to defer | Slice B owns plugin-auth and the auth hub exclusion. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A concurrent main update drops or supersedes mapping rows. | Fetch/rebase before generation and assert every mapping name from current `origin/main` remains. |
| A plausible Purpose misstates an executable edge. | Ground new rows in the real modules and `deno doc --json` output. |
| Generated asset drift | Regenerate prose, asset barrel, then publish assets; run all three checks. |
| Known MCP corpus failure is blamed on this branch. | Reproduce `check:mcp-export-corpus` independently at `origin/main`. |

## Debt and anti-pattern implications

- No architecture debt is created, deepened, or closed.
- Avoid a false-completeness claim and avoid changing implementation to fit stale documentation.

## Validation Plan

Run every command listed in the assignment, record real exit codes at the final committed head,
verify base-relative whitespace, exact final status, lock equality, provenance ancestry, cumulative
mapping retention, and the clean-main MCP corpus baseline.

## PLAN-EVAL

`N/A` — mechanical adoption into an existing checker with fixed scope, a measured coverage rule,
explicit acceptance criteria, and a complete prescribed gate set.
