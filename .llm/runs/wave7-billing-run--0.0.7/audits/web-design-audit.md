# MCP audit — web layer, design system, data flow (findings verified live before use)

Two findings from the raw audit were **already fixed by the builder** before I relayed them, and are
struck out rather than reported: the `lib/billing.ts` `TS2339` type error (`deno check` is green),
and the contract's failure to derive from `@database/zod` (`billing.contract.ts` and
`runs.contract.ts` now import it). Verify before relaying — the tree moves.

## Still live, verified

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | **Tokens are 100% stock.** `tokens.css` and `tokens.json` are byte-identical to the scaffold — divergence is **0 lines, 0 tokens**, not "small". `DESIGN.md` claims ≥40 entries diverge. That claim is currently false. | `git diff 3bdce8e -- assets/tokens.*` empty |
| 2 | **`ChartBlock`, `Donut`, `Dropzone`, `Avatar`, `CodeBlock` are already on disk** in `components/ui/` — the scaffold copied them — but `components/ui/mod.ts` exports **none** of them. The gallery imports 34 names from the barrel and so renders neither chart. `ui:add` is *not* the fix; five export lines are. | `grep -c "chart-block\|donut" components/ui/mod.ts` → 0 |
| 3 | **`webhooks.contract.ts` is still the CLI placeholder** (`z.string().describe('Short record summary')`) while the schema has `WebhookEndpoint`, `WebhookDelivery` with attempts + `replayed`, and `OutboundEvent`. The webhook screen cannot be built on a fiction. | `grep -c "Short record summary"` → 1; `@database/zod` imports → 0 |
| 4 | **`/design` is dev-only.** `routes/(design)/design/_middleware.ts` hard-404s unless `MODE`/`NODE_ENV` is development, while `DESIGN.md` counts `/design/*` as shipped surface. Decide deliberately: keep the gate and stop counting it, or gate on a role (auth is installed). | middleware source |
| 5 | **`RAMP_ORDER` hardcodes `['gray','copper','teal','slate','red','amber']`** in `(_shared)/tokens.ts`. Renaming a ramp without updating that array silently drops it from `/design/tokens`. | tokens.ts:26 |

## The surface the build has not touched (MCP-verified, with citations)

`list_package_exports @netscript/fresh-ui` → **179 exports over 6 subpaths**, and the copy registry
`freshUiRegistryManifest` carries **66 items**. Product code imports `@netscript/fresh-ui` **nowhere**.

- **`DataGrid`** is *imported, not copied* — `pages/reference/fresh-ui` is explicit: *"you do **not**
  `netscript ui:add` it."* Needed for invoice lines, run items (row selection for bulk approve), and
  the delivery log.
- **`@netscript/fresh-ui/interactive`** — 82 exports: `Dialog`, `Drawer`, `Tabs`, `Combobox`,
  `ActionMenu`, `Accordion`, `Popover`, `Sheet`, `Tooltip`.
- **`withToast` / `getToast` / `stripToastFromUrl`** — post-mutation redirect flash; the `Toast`
  island already exists to render it.
- **`@netscript/fresh/form`** (93 exports) — `Form`, `FormRegion`, `.withForm()`, and the CSRF +
  submission-id helpers (`CSRF_FIELD_NAME`, `generateSubmissionId`,
  `getSubmissionHiddenInputProps`). **Imported nowhere.** The server has an `IdempotencyKey` table;
  the browser half that would carry a submission id into it is absent.
- **Optimistic UI has a documented path** and it is not hand-rolled rollback:
  `@netscript/sdk/collections` → `createQueryCollection` + `collection.update()`.
  `search_exports {"query":"optimistic"}` returns no helper in `@netscript/fresh` — this is the one.
- **`@netscript/fresh/query`** (50 exports) — `QueryIsland`, `useIslandQuery`, `useIslandMutation`,
  `useLiveQuery`, `invalidateServerQueryCache`, `HydrationBoundary`. Imported nowhere.
- **Typed routing** — `withRouteContract` / `withPathParams` / `withSearchParams`,
  `paginationSearchSchema`, `defineEnumPathParam`. Used on **zero** routes.
- **Layers/resources** — `.withResource()` / `.withLayer(name, C, { loader, fallback, staleTime,
  partial })` used nowhere; `State = Record<string, never>` so no shared request context exists.
- **`@netscript/fresh/testing`** — route/loader fixtures without an HTTP server. Zero page tests.

Two terms from the brief do **not** exist in NetScript, stated so nobody hunts for them: there is no
"style registry" (the real concepts are the *copy registry* and token/CSS layering), and "dictionary"
is only the glossary page, not an API.

## Credit where due

**Zero raw `fetch(` anywhere in product code.** The prior-build failure mode — page-sized islands
hand-rolling `useState`/`useEffect` refetch — has not appeared. The four existing islands are all
scaffold, all small, all single-purpose, with legitimate local state.

## The live blocker

Every loader still returns a **hardcoded literal**. `routes/dashboard.tsx` ships the scaffold's
`api-gateway / 184ms / 2m ago` fiction as a billing dashboard. No page reads real data, so nothing
downstream — charts, tokens, gallery, forms — can be verified. The unlock is one product route
(`/invoices`) using `.withResource` + `.withLayer({ loader, fallback, staleTime })` calling
`billingQueries.invoices.list(...)`, with `paginationSearchSchema` for typed search state.
