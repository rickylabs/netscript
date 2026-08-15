# Worklog — comparison pages (#1659)

## Run metadata

| Field | Value |
| --- | --- |
| Run | `docs-comparison-vs-pages--1659` |
| Branch | `docs/comparison-vs-pages` |
| Base | `e090f894ff3682405a36e4f896ffd2cc16f9a1f8` |
| Overlay | `SCOPE-docs` |
| State | Implementation started |

## Progress

| Slice | State | Notes |
| --- | --- | --- |
| Planning | complete | Owner contract locked; public APIs checked; Plan-Gate recorded N/A. |
| S1 | complete | Removed 1,802 lines of protocol/migration surface; landing page is 24 lines and navigation points only to the two new pages. |
| S2 | active | Frontend argument and selector. |
| S3 | queued | Backend argument. |
| S4 | queued | Generated assets and complete gate evidence. |

## Wrapper applicability

- Root `fmt` includes only `packages/**/*.ts` and `packages/**/*.tsx` plus the matching plugin
  roots, so the docs source paths are outside its selected set.
- Root `lint` runs its wrapper with only `packages` and `plugins` roots. The docs site is outside
  that task's selected roots; `docs/site verify` supplies the relevant source-format check.

## Gate results

- S1 removed-route search: exit `0` with no matches in `docs/site` or `.llm/tools/docs`.
- S1 `git diff --check`: exit `0`.
- S1 lockfile diff: exit `0` (no `deno.lock` or `docs/site/deno.lock` change).
