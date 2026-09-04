Product owner steer #9 — web-seam audit. I re-verified every item against your live tree; the type
errors and the missing `QueryIsland` were already fixed while the audit ran, so they are dropped.

**First, credit, because this is now the best design layer this build series has produced.**
`tokens.css` (287 declarations) and `tokens.json` (170 cssVars) are in **exact** sync — zero present
in one and missing from the other — with 61 dark overrides matching the manifest and **zero value
mismatches**. Against the stock theme: **48 changed values, 53 net-new product tokens, 38 stock
tokens dropped**, and the ~69 you kept are spacing/radius/motion geometry, which is the right thing
to inherit. `RAMP_ORDER` matches your six real ramps, so nothing silently vanishes from the gallery.
No raw `fetch`, no `setInterval`, no `BroadcastChannel`, no hand-rolled `EventSource` — the live path
correctly reaches for `@netscript/fresh/streams`, and the stream schema is one shared module imported
by both producer and island. Route modules are 55/42/63/111 lines against eis-chat's 62-line median.
Failure-as-data is done properly. **Do not regress any of that.**

## THE ONE THING — your deferred layers are decoration

`partialName` appears **0 times in the entire app**. The docs are explicit: *"a layer with no
`partial` renders inline as usual."*

So on both runs pages the three-layer split buys nothing. The page blocks on the slowest service
call. `RunsTableSkeleton`, `RunSummarySkeleton` and `RunItemsTableSkeleton` are **unreachable dead
code**. `staleReloadMode: 'background'` resolves to a prewarm strategy with nothing to prewarm. And
because the loaders return domain shapes rather than `{ data, cachedAt }`, `staleTime: 15_000`
computes no freshness window at all — three cache-config keys that are inert text.

It is also why `getCachedEntry` appears **0 times** and why `[id].tsx` reaches past `runsQueries` to
the bare client: with no partial to do the authoritative read, the page loader has to, so the cache
tier has nowhere to live.

**Fix:** add `routes/partials/runs/list.tsx` and `…/console.tsx` via `definePartial`, set `partial:`
+ `partialName` on each layer, return `{ data, cachedAt }` from page loaders, and switch page loaders
to `getCachedEntry` with the partial doing the authoritative read. Four other findings collapse with
this one.

## Blockers

- **`/invoices` and `/customers` are 404s linked from your own nav.** `_layout.tsx:53` renders an
  Invoices button and the landing page renders "Open invoices"/"Open customers" cards, all pointing
  at `createRouteReference` stubs with no route module behind them.
- **Three copies of `@tanstack/db`** resolve in `node_modules/.deno` (0.6.17, 0.7.0, 0.8.6). Your app
  pins `^0.6.8`; `@netscript/fresh@0.0.7` resolves another. Pin one across the workspace before it
  bites again.
- **`router.ts:20-24` uses `{id}` where Fresh requires `[id]`.** Empirically in your workspace,
  `createRouteReference('/runs/{id}').href({path:{id:'run_42'}})` returns the literal `"/runs/{id}"` —
  a dead link that **type-checks**, because the pattern infers no params. Delete `appRoutes.run` /
  `appRoutes.invoice` and use the generated `routes.runs.$id.$route`. Also
  `runs-table.tsx:52` hand-builds the href with a template literal.

## Major

- **Typed search params are parsed then thrown away.** You build `paginationSearchSchema` and pass
  only `{status, limit}` — `offset`, `page`, `sortBy`, `sortOrder` are dropped, so `?page=3` returns
  page 1, and `Pagination` is rendered nowhere.
- **Zero mutations.** `withForm`, `Form`, `createQueryCollection`, `mutationOptions` = 0 occurrences.
  Meanwhile your schema has `IdempotencyKey` and `Payment.idempotencyKey @unique`, and your contracts
  declare `409 IDEMPOTENCY_CONFLICT`. The docs: *"pass `ctx.form.submissionId` to a write that treats
  it as an idempotency key."* **A billing console with no compute/approve/exclude/issue/retry/void
  action is a viewer, not a product.**
- **Product pages render with no chrome.** `_layout.tsx:13` gates the topbar, nav and theme toggle on
  `pathname === homeHref`, so `/runs` renders bare — while `SidebarShell` (151 lines, installed) is
  used only by the design gallery. **Your gallery has a better shell than your product.**
- **Five components exported, rendered nowhere.** Commit `ae8fd78` says *"the gallery now renders both
  charts"*. It does not — `components-view.tsx` imports 33 components and not those five;
  `ChartBlock`/`Donut` have **0 hits** outside `components/ui/`. ~500 lines of chart CSS ship on every
  page for charts that render nowhere. **Fix the code or fix the commit message.**
- **Your four product components are in no gallery entry.** `registryCatalog` is still a verbatim
  mirror of upstream. `StatusBadge`, `MoneyText`, `ExceptionBadge`, `TransitionFeed` — the only part
  of the design system that is actually yours — have no reference page.
- **Six product CSS classes are referenced and defined nowhere** (`ns-money-text`,
  `ns-exception-badge`, `ns-transition-feed`, …), so the components compensate with **inline
  `style={}`** — override path zero. They already emit `data-money`/`data-status`/`data-exception`;
  move the rules into `assets/ui/*.css` keyed off those attributes and delete the inline styles.
- **Status coverage: 19 of ~30 domain literals.** `APPLIED`, `TRIALING`, `ACTIVE`, `PAST_DUE`,
  `ENDED`, `RETIRED` are missing and fall through to `status-draft` — so an **ACTIVE subscription
  renders with the draft colour**, while the JSDoc claims unknowns fall back to ink. Four states are
  not enum values and must be derived: part-paid, partially refunded, retrying, in-flight.
- **Currency is never rendered.** `MoneyText` takes a `currency` prop and all five call sites omit it,
  while `Invoice.currency` is per-row. A multi-currency ledger showing bare numbers is a false
  statement about money — same class as a fabricated `0.00`. (Your em-dash-for-absence handling is
  excellent and better than I asked for.)
- **Scaffold fiction still ships.** `dashboard-view.tsx` is 165 orphaned lines of fabricated
  telemetry (`612ms` P95, `Progress value={64}`) imported by nothing. `home-view.tsx` states three
  falsehoods including `Routes value='6'` naming deleted routes and `Theme value='NS One'`.
  `_app.tsx:14` still describes the app as *"NetScript starter scaffold"*.

## Minor worth doing while you are there

`tokens.json` claims `generatedBy: apps/ledgerline-web/tokens.build.ts` — **that file does not
exist**; hand-maintained while claiming a generator is how a 170/170 sync rots. 12 tokens
(`size`, `layout`, `label` groups) have no accessor in `(_shared)/tokens.ts` so they can never render
on `/design/tokens`. One raw hex remains: `assets/ui/switch.css:27`. `transition-feed.tsx:27`
formats a time on both SSR and hydration → mismatch; format server-side. `routes/index.tsx:7-8` calls
`.withRoute()` twice. `_app.tsx:8` hardcodes `data-theme='dark'` before the init script reads
localStorage.

**Note:** `defineRegion` is **not** a NetScript export — the Settled/Fallback/Failed triple is an
app-owned convention you write yourself. Your skeletons are the Fallback halves, sitting unpaired.

Keep parallelising. Partials first, then `/invoices` + `/customers`, then mutations.
