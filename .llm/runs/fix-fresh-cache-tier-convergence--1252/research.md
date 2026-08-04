# Research — fresh/sdk cache-tier convergence

## Re-baseline

- Carried-in sources:
  - issue [#1252](https://github.com/rickylabs/netscript/issues/1252), including its four corrective/specification comments;
  - Pulseboard commit [`56accbb9f222acace4bdefb117dc4c6cfeb59bce`](https://github.com/rickylabs/pulseboard/commit/56accbb9f222acace4bdefb117dc4c6cfeb59bce).
- Re-derived against `origin/main` @ `9bcfd18f28c60c07206b6ce5dd564d1d3f6edeee` on 2026-08-04,
  then rebased before implementation onto `26fe0da9b966e41a01493ff1c10baa609fb42460` after two
  unrelated service/MCP commits landed during draft creation.
- The dispatched branch was three commits behind `origin/main` and had no local commits. It was
  fast-forwarded before planning. The only pre-existing worktree edit is one user-owned
  `deno.lock` row for `jsr:@netscript/queue@0.0.4`; it is excluded from this run.

## Reference-fix absorption

Pulseboard needed 58 changed lines across three product files:

1. `api/board-cache.ts` added a same-origin POST route whose sole job is calling the server-only
   `boardQueries.board.invalidate()` API in the board process.
2. `BoardIsland.tsx` used a `useRef`-guarded `setQueryData()` before `useQuery`, invalidated the
   server cache before the browser cache, and exposed a non-destructive cache-cleanup failure path.
3. `board-data.ts` stopped calling `fetchQuery(queryOptions())` because that `queryFn` bypassed
   `CacheQuery`; it called the cache-aware action with `preferFreshOnStale: true` instead.

The framework seam should absorb those requirements, not transplant product code:

- SDK `queryOptions().queryFn` can select the registered `CacheProvider` on the server and retain
  direct client invocation in the browser, where no provider exists.
- Fresh app bootstrap can own one standard cache-invalidation POST route, while the Fresh query
  client owns its paired fetch helper. Products configure/use the seam; they do not create a route.
- The Fresh query hook can seed `initialData` once per mount before TanStack observes a pre-existing
  shared-client entry. A mount guard preserves later optimistic/refetched data.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| R1 | `@netscript/fresh` and `@netscript/sdk` are both doctrine Archetype 4 packages. | `docs/architecture/doctrine/06-archetypes.md` assignment table |
| R2 | `ActionMethod()` calls `getCacheProvider().query(...)`, but `queryOptions().queryFn` calls `invokeClientProcedure(...)` directly. | `packages/sdk/src/query/query-factory.ts` |
| R3 | Cache-aware server keys are `[resource, action, JSON.stringify(input)]`; TanStack client keys are `[resource, action, { input }]`. | `packages/sdk/src/ports/query-key.ts`; `query-factory.ts` |
| R4 | `ActionQueryOptions` currently carries only client `staleTime`, so `preferFreshOnStale` cannot be expressed through server-side `fetchQuery(queryOptions())`. | `packages/sdk/src/query-client/types.ts` |
| R5 | `IslandQueryOptions` lacks `initialDataUpdatedAt`, although SDK types and docs recommend it. | `packages/fresh/src/application/query/query-types.ts`; `packages/sdk/src/query-client/types.ts` |
| R6 | `useIslandQuery` forwards options directly to TanStack. Existing shared-client data therefore wins before `initialData` can seed. | `packages/fresh/src/application/query/hooks.ts`; TanStack behavior reproduced by planned RED test |
| R7 | `IslandQueryResult` omits `isFetching` and `isRefetching`, even though the underlying result and docs use them. | `packages/fresh/src/application/query/query-types.ts`; `docs/site/web-layer/fresh-ui.md` |
| R8 | `defineFreshApp` already performs server-only SDK cache registration, but it registers no browser-reachable invalidation route. | `packages/fresh/src/runtime/server/define-fresh-app.ts` |
| R9 | Current docs explicitly describe both defects: `initialDataUpdatedAt` is rejected, and `queryOptions().queryFn` bypasses KV. | `docs/site/web-layer/query-bridge.md` |
| R10 | Issue-body acceptance remains the close-gate source; corrective comments revise the defect model and add cache-aware/hydration acceptance. Both sets must be satisfied honestly. | issue #1252 body + comments; `netscript-pr` close-gate rules |

## jsr-audit surface scan

- Surface scanned: all exports in `packages/fresh/deno.json` and `packages/sdk/deno.json`.
- `@netscript/fresh` baseline structured doc lint: 44 diagnostics (27 `private-type-ref`, 17
  `missing-jsdoc`) concentrated in pre-existing query/route/streams surfaces.
- `@netscript/fresh` baseline JSR audit: dry-run OK with existing slow-type warning; existing module
  tag failures for `./ai` and `./vite`; existing `src/runtime/ai` cardinality warning.
- `@netscript/sdk` baseline structured doc lint: one transitive `private-type-ref` diagnostic; audit
  dry-run OK with existing slow-type and root-cardinality warnings.
- Planned public-surface risks: new exports must carry JSDoc, `ActionQueryOptions` must remain
  browser-safe, query-hook types must not leak new private upstream types, and the standard endpoint
  contract must use JSON/Web Platform types. The slice may not deepen baseline diagnostics.

## Open questions resolved during planning

- Archetype: resolved as Archetype 4 + frontend overlay; runtime/browser/consumer gates are added
  because the builder/query DSL materializes browser cache behavior.
- Server invalidation safety: use a fixed JSON-only same-origin endpoint registered by
  `defineFreshApp`, reject malformed/non-JSON keys, and allow opt-out/path override. No generic
  service mutation or product-specific route is introduced.
- Hydration precedence: server-provided `initialData` wins exactly once on hook mount; optimistic
  writes and client refetches win thereafter. `initialDataUpdatedAt` preserves server cache age.
