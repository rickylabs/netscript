# Worklog — comparison pages (#1659)

## Run metadata

| Field | Value |
| --- | --- |
| Run | `docs-comparison-vs-pages--1659` |
| Branch | `docs/comparison-vs-pages` |
| Base | `e090f894ff3682405a36e4f896ffd2cc16f9a1f8` |
| Overlay | `SCOPE-docs` |
| State | S4R complete; awaiting owner re-review |

## Progress

| Slice | State | Notes |
| --- | --- | --- |
| Planning | complete | Owner contract locked; public APIs checked; Plan-Gate recorded N/A. |
| S1 | complete | Removed 1,802 lines of protocol/migration surface; landing page is 24 lines and navigation points only to the two new pages. |
| S2 | complete | Fixed-first NetScript page, four competitor code panels, partial-I/O line, and compact architectural estimates. |
| S3 | complete | One route contract, typed service client, validated worker payload, and three competitor implementations. |
| S4 | superseded | Initial generated layers and gates were green before Tier-A findings changed the backend page. |
| S3R | complete | Backend estimate close and consumer-contract move added; real public export confirmed; all three scratch checks pass. |
| S4R | complete | Three layers regenerated in order; final freshness/docs/git gates pass. |

## Wrapper applicability

- Root `fmt` includes only `packages/**/*.ts` and `packages/**/*.tsx` plus the matching plugin
  roots, so the docs source paths are outside its selected set.
- Root `lint` runs its wrapper with only `packages` and `plugins` roots. The docs site is outside
  that task's selected roots; `docs/site verify` supplies the relevant source-format check.

## Gate results

- S1 removed-route search: exit `0` with no matches in `docs/site` or `.llm/tools/docs`.
- S1 `git diff --check`: exit `0`.
- S1 lockfile diff: exit `0` (no `deno.lock` or `docs/site/deno.lock` change).
- S2 first full verify: exit `1` only because the S3-owned `/comparisons/backend/` destination did
  not exist yet; source format, site build, and rendered-output checks passed before the link check.
- S2 `deno task --cwd docs/site build`: exit `0` after the final frontend edit.
- S2 rendered DOM inspection: four selector options and two rendered blocks per competitor; only
  the first competitor lacks `hidden` in the source HTML.
- S3 public API docs: `baseContract`, `createServiceClient`, `workersContract`, `defineJobHandler`,
  and `createSuccessResult` each returned exit `0` from `deno doc` on the workspace package surface.
- S3 `deno task --cwd docs/site verify`: exit `0`; 35,342 internal links across 227 pages resolve,
  and all 18 caveat markers resolve.
- S3 rendered DOM inspection: three selector options and two rendered blocks per competitor.
- S4 generators, in required order: `gen:agent-docs-prose` exit `0`, `gen:assets-barrel` exit `0`,
  `gen:publish-assets` exit `0`.
- The first pre-commit `check:assets-barrel` returned `1` because that task ends with a generated-file
  diff against `HEAD`; after the run-owned generator output was committed locally, its final exit was
  `0`. No generator repair was required.
- S4 final freshness: `check:agent-docs-prose` exit `0`, `check:assets-barrel` exit `0`,
  `check:publish-assets` exit `0`, `check:mcp-export-corpus` exit `0`.
- S4 `deno task --cwd docs/site verify`: exit `0`; 638 files generated, 35,342 internal links
  across 227 pages resolve, and 18 caveat markers resolve.
- S4 `deno task docs:links`: exit `0`; 103 docs, zero broken links, zero broken anchors, zero
  orphans.
- S4 `deno task docs:accuracy`: exit `0`; 199 published pages and 181 shipped corpus files checked.
- S4 `git diff --check`: exit `0`.
- S4 `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock`: exit `0`.
- Removed-route scan across live docs and generated text: no matches.
- Tier-A T3: `deno doc --filter baseContract packages/contracts/mod.ts` exit `0`; the public root
  exports the genuine `ReturnType<typeof oc.errors>` builder and documents the
  `.route().input().output()` chain from `@netscript/contracts`. The fixture-shaped grep hit was
  isolated to scaffolder-test text.
- Tier-A T4 frontend scratch fixture: structured check wrapper raw exit `0`, covering the main
  `definePage()` chain and the `loader: () => undefined` partial configuration.
- Tier-A T4 backend scratch fixture: structured check wrapper raw exit `0`, covering the public
  contract builder, `implement`, service clients, workers contract, and job handler. Scratch files
  remain under `.llm/tmp/` and are not committed.
- Tier-A T4 consumer-only scratch fixture: structured check wrapper raw exit `0`; importing the
  contract object into `createServiceClient()` preserves the typed `create(...)` call without a
  generated artifact.
- S3R `deno task --cwd docs/site build`: raw exit `0`; docs source format, 638-file render, and
  rendered-output checks pass.
- S4R generators, in required order: `gen:agent-docs-prose` raw exit `0`,
  `gen:assets-barrel` raw exit `0`, `gen:publish-assets` raw exit `0`.
- S4R generated diff is limited to the prose bundle/provenance, generated CLI agent-doc barrel,
  and generated MCP publish corpus.
- S4R final freshness: `check:agent-docs-prose` raw exit `0`, `check:assets-barrel` raw exit `0`,
  `check:publish-assets` raw exit `0`, `check:mcp-export-corpus` raw exit `0`.
- The first parallel S4R freshness pass produced a transient `check:agent-docs-prose` exit `1`, and
  the first docs verify produced a transient exit `1`, while a concurrent owner-side gate process
  rewrote the shared generated site directory. The foreign process was left untouched; both checks
  returned `0` when rerun sequentially after it exited.
- S4R `deno task --cwd docs/site verify`: raw exit `0`; 638 files generated, 35,342 internal links
  across 227 pages resolve, and all 18 caveat markers resolve.
- S4R `deno task docs:links`: raw exit `0`; 103 docs, zero broken links, zero broken anchors, zero
  orphans.
- S4R `deno task docs:accuracy`: raw exit `0`; 199 published pages and 181 shipped corpus files
  checked.
- Scratch verification briefly registered its directory as a workspace member so local package
  catalogs resolved. That registration and the generated lock member were removed immediately;
  `deno.json`, `deno.lock`, and `docs/site/deno.lock` returned to their committed state.

## Handoff

- Draft PR remains `status:impl` and is not ready or merged.
- No evaluator, browser, service, container, scaffold, or E2E lane ran.
- Owner re-review follows S3R and the replacement S4R evidence.

## Reconcile notes

- S3R: issue #1659 remains open and fully owned by draft PR #1660; `Closes #1659`, milestone
  `0.0.7`, docs/CI labels, and exactly `status:impl` remain correct. The owner Tier-A findings are
  implemented without changing scope or creating follow-up issues.
- S4R: the replacement generated assets and all requested gates are complete. PR #1660 remains a
  draft with `status:impl`; the next action is owner re-review, not evaluation or merge readiness.
