# docs-661a-storefront — worklog (Opus 4.8, beta-8 orchestrator)

Issue #661 rollout: raise the STOREFRONT tutorial series to the MedusaJS quality bar. Worktree
`/home/codex/repos/ns-b8-661a`, branch `docs/661-storefront-quality`, base `955b4abf`.

## Scope executed (from the #662 audit report)

- **Proposal #6 (headline)** — added a dedicated frontend chapter
  `06-storefront-ui.md` showing the typed end-to-end stack the storefront series never touched:
  a bound route contract (`createRouteReference` / `defineRouteContract` / `bindRoutePattern` +
  `paginationSearchSchema` / `fallback`), a single clients module
  (`createServiceClient` per service → `createServiceQueryUtils`), and a Fresh island reading with
  `useIslandQuery` and beginning checkout with `useIslandMutation`. Deploy renumbered 06 → 07;
  full prev/next/learningPath/index/xref navigation rewired across the series.
- **Proposal #17** — `index.md` lede now names the differentiator ("one typed contract, honored
  from the database to the button") and a "what this replaces" contrast sentence
  (REST + fetch-wrapper + DTO drift).
- **Proposal #18** — `07-deploy.md` intro surfaces the one-command scaffold-to-running-Aspire story
  explicitly ("`netscript init` scaffolded it, `aspire start` runs it — empty folder to observable
  stack in two commands, no deploy YAML").
- **Proposal #7** — `02-catalog-service.md` gains a note next to
  `parseInt(Deno.env.get('PORT') || '3001')` explaining Aspire injects `PORT` and
  `netscript.config.ts` `services.products.port` is the typed source of truth.

Matrix flagged the remaining storefront chapters (01,03,04,05) "good" on every axis except
series-level showcase; per scope they were left unchanged apart from the learningPath renumber.

## Grounding (deno doc + scratch deno check — never invented an API)

- `deno doc` over `packages/fresh/src/application/query/mod.ts`, `packages/sdk/mod.ts`, and the
  port types confirmed the surface: `createServiceClient`, `createServiceQueryUtils` (per-procedure
  `ServiceProcedureQueryUtils` with `queryOptions`/`mutationOptions`/`queryKey`/`key`/`mutationKey`),
  `useIslandQuery`/`useIslandMutation`/`QueryIsland`/`useQueryClient`. Route surface
  (`createRouteReference`, `defineRouteContract`, `bindRoutePattern`, `paginationSearchSchema`,
  `fallback`) matches the approved exemplar `workspace/05-route-authz.md`.
- **Scratch `deno check` #1 (SDK chain)** — a type-fixture exercising
  `createServiceClient<typeof cartContract>` → `createServiceQueryUtils` →
  `.queryOptions({ input })` / `.mutationOptions({ onSuccess })` compiled clean against the real
  `packages/sdk`.
- **Scratch `deno check` #2 (island assignability)** — proved the SDK
  `queryOptions()`/`mutationOptions()` result **cannot** be raw-spread into the island hooks (their
  `queryFn` is zero-arg, `mutationFn` is required). Caught before writing. The chapter therefore
  uses the honest seam: contract-derived **keys** from the utils, typed **client call** as the
  hook's `queryFn`/`mutationFn`. Confirmed the honest adaptation compiles.
- Island result field names verified against `query-types.ts`
  (`IslandQueryResult.data/isLoading`, `IslandMutationResult.isPending/mutate`) — no invented fields.
- All scratch files were removed after checking (nothing left under `.llm/tmp/` or the packages).

## Code:prose ratios (acceptance box 1)

Computed as fenced-code lines / body lines (excludes frontmatter).

| Chapter | Before | After |
|---|---|---|
| 01-scaffold | 5% | 5% (learningPath only) |
| 02-catalog-service | 40% | 38% (added PORT note) |
| 03-cart-contracts | 44% | 44% (learningPath only) |
| 04-checkout-saga | 43% | 43% (learningPath only) |
| 05-shipping-webhook | 24% | 24% (nav only) |
| 06-storefront-ui | — (new) | **42%** |
| 07-deploy (was 06) | 9% | 8% (added one-command framing) |
| index | 0% | 0% (prose index; +differentiator lede) |

New chapter lands at 42% code — inside the MedusaJS 25–45% band and level with the series' densest
chapters (03/04). Prose-dominant chapters (01, 07, index) were "good" on the audit's code:prose axis
and intentionally not padded.

## Validation

- `deno task verify` from `docs/site`: **green** — site built (515 files), **170 pages** (≥169
  expected; base 169 + 1 new chapter), **23624 internal links across 170 pages all resolve**
  (renumber broke nothing), 27 caveat markers resolve.
- Grep gate `eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]` over touched files
  (`docs/site/tutorials/storefront/`, `docs/site/_data/xref.ts`): **0 hits**.
- No stale `storefront/06-deploy` or `6 · Deploy` references remain.

## Files touched

- NEW `docs/site/tutorials/storefront/06-storefront-ui.md`
- RENAME `06-deploy.md` → `07-deploy.md` (+ intro/prereq/nextPrev/one-command framing)
- `01/02/03/04/05` chapters — learningPath renumber (7 steps); 05 next-link → ch6; 02 PORT note
- `index.md` — differentiator + what-this-replaces lede, 7-chapter grid + UI card, renumbers
- `docs/site/_data/xref.ts` — `tut:storefront/06` → storefront-ui, new `tut:storefront/07` → deploy
