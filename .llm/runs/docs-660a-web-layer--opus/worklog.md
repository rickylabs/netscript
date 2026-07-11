# Worklog — #660 slice A: web-layer pillar overhaul (Opus, docs lane)

Branch `docs/660-web-layer-pillar` · base `955b4abf` (preflight passed: HEAD `955b4abf`,
`tutorials/chat/05-mcp.md` present) · run dir `.llm/runs/docs-660a-web-layer--opus`.

Owned audit proposals: **#1, #2 (matrix-level only), #13, #14, #16** + the #660 web-layer coverage
matrix. (#2 pagination rewrite of a live-dashboard tutorial chapter is owned by another slice; this
slice records it in the matrix as out-of-scope.)

## Grounding (verified, not assumed)

- `deno doc` over `packages/fresh/src/application/route/mod.ts`, `.../query/mod.ts`,
  `packages/sdk/src/query/mod.ts`, `packages/sdk/src/query-client/mod.ts`.
- Exact call shapes read from `packages/sdk/src/ports/service-query-utils.ts`:
  - `queryOptions({ input, staleTime?, enabled?, queryKey? })` → `{ queryKey, queryFn }`.
  - `mutationOptions({ onSuccess?, onError?, onSettled?, mutationKey? })` → `{ mutationFn, mutationKey }`;
    `mutate` takes the raw typed procedure input (no `{ input }` wrapper). `onMutate` is NOT a
    `mutationOptions` field, so the optimistic seam is added on the `useIslandMutation` call.
  - `createServiceQueryUtils(client, { path })` — verified via source `@example`.
  - `queryKey({ input })` helper exists for building the list key used in optimistic rollback.
- Reference apps: `netscript-start-ref/apps/frontend/lib/api-clients.ts` (single-file typed clients,
  one `createServiceClient` per service, contracts from a shared alias) and the scaffold `routes`
  registry seed (`createRouteReference(routePatterns.X.$route, { id, kind })`). No reference-app or
  internal names appear in any doc text (public-docs law).

## Pages touched — before / after

| Page | Before | After |
| --- | --- | --- |
| `_plan/web-layer-coverage-matrix.md` | (did not exist) | New unpublished matrix: every shipped fresh/fresh-ui/sdk frontend capability × treatment, grounded in `deno doc` + both reference apps. |
| `web-layer/query.md` | 3 raw-`fetch` `queryFn`/`mutationFn` examples (widgets list, doc poll, todo toggle); never named the sdk bridge. | Added "From contract to island: the typed query chain" + single `lib/api-clients.ts` (`createServiceClient` → `createServiceQueryUtils`). All 3 examples now spread `queryOptions()`/`mutationOptions()` into `useIslandQuery`/`useIslandMutation`; optimistic rollback preserved via `queryKey({ input })`. One raw `fetch` retained under an explicit **"Endpoints without a NetScript contract"** heading (external API). Added SDK cross-link (card + inline). |
| `web-layer/form.md` | Write path was a `// Run the mutation` comment; forms never connected to typed mutations. | New "Posting the validated payload through a typed mutation": server handler calls the typed client (`contactsClient.create(result.data)`), plus an island `useIslandMutation({ ...contacts.create.mutationOptions() })` variant — mirrors query.md read path (proposal #14). |
| `web-layer/interactive.md` | Islands primer with only `usePromise`/`resolvedPromise`; no typed query/route tie-in. | New "What makes a NetScript island distinct: the typed query island" — `createRouteReference` + `QueryIsland` + contract-derived `queryOptions()` (proposal #13). |
| `web-layer/examples.md` | Index/cache-helper page; no runnable typed showcase. | New "The smallest typed example, end to end" — route reference + `QueryIsland` + `orders.list.queryOptions()` composing route/query/sdk (proposal #13). |
| `web-layer/testing.md` | Only `createMockRouteContext`/`createMockDeferPolicy`; no bound-contract parse test. | New "Testing a bound route contract" — `Deno.test`s exercising `parseSearch` (offset derivation) and `safeParsePath` (enum rejection) (proposal #13). |
| `services-sdk/sdk.md` | "hand-rolled fetch wrapper tax" sentence unlinked. | Linked to `/web-layer/query/` — bidirectional cross-link (proposal #16). |

## Matrix highlights

- Highest-impact fix landed: `query.md` no longer teaches raw `fetch` in `queryFn`/`mutationFn`;
  the whole page now flows contract → client → query-utils → island hook, matching
  `web-layer/fresh-ui.md` one page over.
- One honest escape hatch retained (external, contract-less endpoint) so the untyped fallback is
  shown without being presented as the default.
- Read/write symmetry closed: form.md write path + interactive/examples/testing all now connect to
  the typed route/query surface that distinguishes NetScript islands from vanilla Fresh islands.
- Out-of-scope-for-this-slice rows (tutorial showcase gaps: proposals #2–#6) recorded in the matrix
  as owned by other #660 slices.

## Validation evidence

- Base preflight: HEAD `955b4abf…`, `tutorials/chat/05-mcp.md` present → PASS.
- Baseline `deno task verify` (pre-edit): built 512 files; **169 pages / 23450 internal links** all
  resolve; 27 caveat markers / 22 pages resolve. Matches the ~169/~23.5k main-parity expectation.
- Post-edit `deno task verify`: **169 pages / 23464 internal links** all resolve (+14 from new
  cross-links); 27 caveat markers / 22 pages resolve. GREEN.
- Public-docs grep `eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]` over
  `docs/site` (excluding `_plan/`): **0 hits**.
- Remaining raw `fetch(` in the touched pages: exactly one, the intentional external-endpoint
  example under "Endpoints without a NetScript contract".

## Notes / drift

- Proposal #1 text names `createServiceQueryUtils`; `web-layer/fresh-ui.md` uses the sibling
  `createQueryFactories` (KV-backed SWR). Both are shipped and correct. Followed the slice spec
  (`createServiceQueryUtils`, the pure client→island bridge) and added a one-line note + cross-link
  in query.md pointing to `createQueryFactories` in `services-sdk/sdk.md` for the cache-first
  variant, so the two pages reinforce rather than contradict.
- Doc code blocks are not type-checked by `deno task verify`; every API used was verified against
  `deno doc`/source signatures (see Grounding), not memory.
