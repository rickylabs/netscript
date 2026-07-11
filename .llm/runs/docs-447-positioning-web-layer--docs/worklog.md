# Worklog — docs/447-positioning-web-layer (issue #447, D8 web-layer stories)

Branch: `docs/447-positioning-web-layer` from `7f7ed76be66fbfcf1133f7c4bcab33737aa09c78`.
Scope: `docs/site/web-layer/{index,fresh-ui}.md` only (fold `fresh-framework` story into index).
Lane: Claude documentation-authoring exception (beta-7 ship orchestrator, epic #401, depends #433).

## Plan

1. `web-layer/index.md` was a thin nav landing after #433 folded `capabilities/fresh-framework.md`
   into a redirect stub pointing at `/web-layer/`. Rewrite it on the D story template: elevator
   pitch (build-efficiency framing) → story spine (API-drift failure mode, grounded in the public
   scaffold evidence `apps/dashboard/lib/example-service.ts` / `UsersContractV1`) → mechanism
   (definePage model folded from the old fresh-framework page, cross-linked to the existing
   web-layer leaf pages, not duplicated) → cross-links (cards grid retained, fresh-ui card added).
   Reused the existing `fresh-page-model.svg` diagram. T3 page: no named competitor here (proposal
   §4.3 row 17 = "(light)"); the pillar's one comparison lives on fresh-ui.
2. `web-layer/fresh-ui.md` (already mechanism-rich, moved intact by #433): add the story-template
   top — elevator pitch + "Why copy-source, concretely" spine (agent-cannot-edit-the-component
   failure mode → `ui:add` copy-source + `(design)` live gallery) — and the one factual competitor
   comparison (Astro one-click browser sandboxes vs the in-repo `(design)` live gallery, per the
   teardown §2 "Astro tone + live sandbox (T3)" angle). Added one sentence framing the shipped
   AI/workspace registry group as a component vocabulary an app can map structured model output
   onto (pattern, not an unshipped generator claim). No existing accurate content removed.

## Accuracy evidence (claim → verification)

Published beta.7 fetch is blocked by the rolling 1-day minimum-release-age guard (beta.7 published
< 24h ago), so symbols were verified with `deno doc` against the local workspace source at the
branch base SHA, whose `packages/fresh/deno.json` / `packages/fresh-ui/deno.json` are both
`"version": "0.0.1-beta.7"` (the surface the cut publishes).

| Claim (page) | Command | Found |
| --- | --- | --- |
| `definePage()`, `definePartial()` (index) | `deno doc packages/fresh/src/application/builders/mod.ts` | yes — `definePage<TState>(): PageRootBuilder<TState>`, `definePartial(...)` |
| `defineRouteContract()`, `paginationSearchSchema()`, `createRouteReference()` (index) | `deno doc packages/fresh/src/application/route/mod.ts` (via `./route` export) | yes |
| `defineFreshApp()` (index) | `deno doc --unstable-kv packages/fresh/src/runtime/server/mod.ts` | yes — `defineFreshApp<State>(options): App<State>` |
| `QueryIsland`, `useQuery`, `useMutation`, `useLiveQuery` (index) | `deno doc` on the `./query` export module | yes — all four (plus `useQueryClient`, `useIslandQuery`, …) |
| `netscript ui:add` copy-source install, `(design)` gallery, `assets/tokens.json` (fresh-ui) | pre-existing page claims retained unchanged (verified in the #433-moved page) | yes — unchanged |
| Astro one-click browser sandboxes (fresh-ui comparison) | teardown `research/D-positioning/competitor-teardown.md` §1 in-repo Astro prior art | factual, falsifiable |

## Positioning-law self-check

`grep -iE "honest|candor|candidly|throughput|% faster|fastest|best[- ]in[- ]class|world.s best|unbreakable|blazing"`
over both pages → no matches. One competitor comparison in the pillar (Astro, fresh-ui page);
index carries none. No `_plan/*` prose lifted; no fabricated numbers; no unshipped-capability
claims (SigNoz/generative-UI-engine material deliberately excluded).

## Validation

`deno task verify` in `docs/site` (build → check:links → check:caveats):

- `🍾 Site built into _site — 500 files generated in 9.58 seconds`
- `23030 internal links across 162 pages — all resolve`
- `27 caveat markers across 22 pages — all references resolve`

VERDICT: green.
