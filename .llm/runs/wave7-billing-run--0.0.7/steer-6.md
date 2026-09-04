Product owner steer #6. **STOP ALL BACKEND WORK. Frontend only until it ships.**

Eleven hours in. The backend is genuinely strong — sagas, transactions, auth enforcement, contract
derivation, the prefix fix. The frontend does not exist. Measured against your tree right now:

| | |
| --- | --- |
| `tokens.css` diff vs scaffold | **0 lines** |
| `tokens.json` diff vs scaffold | **0 lines** |
| Product routes | **0** — `routes/` is entirely scaffold, untouched for 11 hours |
| Product islands | **0** |
| Charts exported from `components/ui/mod.ts` | **0 of 5 already on disk** |
| `(design)/…/registry.ts` diff | **0 lines** |

`routes/` still contains `dashboard.tsx` shipping the scaffold's fake `api-gateway / 184ms` row, plus
`examples/` and an `api/` folder. That is what a reviewer opens first.

**This is exactly how all three prior builds of this assignment failed** — deep backend, default
frontend — and it is the single thing that decides whether this reads as a product or a demo. A
tenth backend refinement is worth nothing next to one real screen.

## The bar, restated as numbers

`rickylabs/eis-chat` is the standard and it is not aspirational, it is measured: **156 design tokens**
in its own token source, **35 dark-mode semantic overrides**, a `/design` sub-app of **1,694 lines**,
**50 UI primitives**, **19 raw hex values across 16,734 lines of CSS**. Its token source *is* the
design — brand-derived ramps, green-tinted shadows, tokenised layout.

`CONSTRUCTION-REFERENCE.md` (attached, read it first) has the full vertical slice of a real screen:
route module under ~70 lines, layers split by cost profile, the `{Settled, Fallback, Failed}` region
triple, cache-only page loaders with authoritative partials, two-tier invalidation, small islands fed
by props, and hand-authored SVG charts over tokens.

## Do these, in this order, and commit after each

1. **Rewrite the token source.** Both `assets/tokens.css` **and** `assets/tokens.json` — they must
   diverge, ≥40 entries, provable by `git diff`. Ledgerline is a finance product: pick a real
   identity (paper/ink, ledger-green money-in, rust for reversals), a tabular-numeral font for money
   columns, your own radius and shadow scales. Check `(_shared)/tokens.ts` `RAMP_ORDER` — it
   hardcodes the stock ramp names, so renaming a ramp without updating it silently drops it from
   `/design/tokens`. Light and dark must both work and be genuinely different images.
2. **Export the five components already sitting in `components/ui/`** — `chart-block`, `donut`,
   `dropzone`, `avatar`, `code-block`. Five lines in `mod.ts`. Your gallery renders neither chart
   today because of those five missing lines.
3. **Delete the scaffold fiction**: `routes/dashboard.tsx`, `routes/examples/**`, `routes/api/**`.
4. **Ship the run console** — the product's whole thesis, and the screen a reviewer will judge.
   `.withResource` + `.withLayer({ loader, fallback, staleTime, partial })`, reading through
   `billingQueries` / `runsQueries`. A thin `QueryIsland` boundary with an inner `useLiveQuery`
   subscriber over your existing durable-stream producer. **Two tabs, same run advancing, no reload.**
5. **Ship `/invoices` and an invoice detail route** with `paginationSearchSchema` typed search state
   and `DataGrid` (imported from `@netscript/fresh-ui`, never `ui:add`).
6. **Register ≥6 of your own components** in `(design)/…/registry.ts` and render them in the gallery
   in your skin. All three prior builds shipped that file byte-identical; that is the fingerprint of
   a themed scaffold.
7. **Design every reachable state**: draft, issued, paid, part-paid, failed, retrying, refunded,
   partially refunded, voided, in-flight, empty, loading, permission-denied. A screen that renders
   only the happy path is not done. Absence is an em dash, never a zero — a `0.00` where you meant
   "not measured" is a false statement about money.
8. **Mutations through the managed form surface** — `.withForm()`, `Form` from `@netscript/fresh/form`,
   carrying `getSubmissionHiddenInputProps()` into the `IdempotencyKey` table you already built, so a
   double-click is one charge. Optimistic UI via `createQueryCollection` + `collection.update()` —
   that is the documented path; there is no optimistic helper in `@netscript/fresh`.

## Rules that still bind

Ask the MCP before hand-rolling anything — that rule produced three defects already. No raw `fetch`,
no polling, no `BroadcastChannel`. Customize through the seams: token source, `data-*` attributes the
component already emits, a `class` prop merged by `cn()`, a per-surface block file. Never fork a
component, never a parallel stylesheet, never `!important`.

Commit and push after each numbered item. If you must cut something, cut backend polish — never a
screen, and never a state.
