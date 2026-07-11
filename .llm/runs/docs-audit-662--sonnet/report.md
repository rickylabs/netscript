# Docs Quality Audit — Issue #662 (v2, consolidated)

Read-only audit of `docs/site` (published surface: tutorials, 9 pillars, how-to, reference,
explanation) against 4 axes: feature-coverage, anti-patterns, code:prose balance vs the MedusaJS
bar, and highlight-feature showcase. `docs/site/_plan/` and `docs/site/capabilities/*` (redirect
stubs) are out of scope. Verified starting state: `tutorials/chat/` has 6 real chapters
(01-06, including `05-mcp.md`/`06-live-streaming.md`); `tutorials/eis-chat/` is redirect-stub-only
(4-line files, `layout: layouts/redirect.vto`) — audited as N/A, not a content page.

This v2 consolidates three parallel audit lanes (web-layer/ai + typed-route surface; all 5 tutorial
series; how-to/reference/explanation/remaining pillars) plus direct grounding verification. Full
lane detail lives beside this file in `fork-web-layer-ai.md` and `fork-tutorials.md`.

## Grounding (all verified, not assumed)

- **Both reference-repo clones succeeded** (correcting v1, which claimed they were skipped).
  The playground frontend repo's `apps/frontend/lib/api-clients.ts` centralizes typed service
  clients (`createServiceClient<typeof usersContract>({ contract, serviceName })` per service,
  contracts from a shared alias, Aspire discovery via `getServiceUrl`) — the concrete "single
  source of typed clients" pattern the docs should teach. The internal reference app's
  `apps/dashboard/router.ts` builds a `createRouteReference` registry
  (`/project/[project]/channel/[channel]/...`) consumed via `.withRoute(routes...$route)` in every
  page — proof the typed route system is the real production pattern, not aspirational. Per the
  public-docs law, no internal app name appears in any proposed doc text below.
- **Typed surface inventory from source + `deno doc`**
  (`packages/fresh/src/application/route/mod.ts`): `createRouteReference`, `defineRouteContract`,
  `bindRoutePattern`, `defineEnumPathParam`, `paginationSearchSchema()`, `fallback()`, and on the
  reference itself: `.href()`, `.Link`, `.getLinkProps()`, `.parsePath`/`.parseSearch` +
  `safeParse*`, `.withPartial()`, `createNav`/`RouteNavigation`. Query side
  (`packages/fresh/src/application/query/mod.ts`): `useIslandQuery`, `useIslandMutation`,
  `useIslandInfiniteQuery`, `useLiveQuery`/`useLiveSuspenseQuery`, `QueryIsland`, dehydrate/hydrate
  SSR handoff. SDK bridge: `createServiceClient<TContract>()`, `createServiceQueryUtils(client)`,
  `defineServices()` — the intended contract → client → query-utils → island-hook chain.
- **MedusaJS quality bar fetched live** (3 pages: custom module, custom API route, admin widget):
  25–45% code per page; complete-runnable-file-preferred code blocks, each labeled with its exact
  file path; 2–6 single-action numbered steps; recurring Prerequisites → Steps → "Test it out" →
  Next Steps skeleton; verification by JSON response or screenshot. (v1 overstated
  "terminal output after every step" — that is actually Medusa's *weakest* element; the
  load-bearing elements are complete files + path labels + a Test section.)

## MedusaJS quality bar (validated, 5 points)

1. Every step's code block is a **complete, copy-pasteable file labeled with its exact path** —
   fragments are the exception, not the rule.
2. Steps are **single-action and few** (2–6 per page); prose sits directly under each code block
   explaining *why this step*, not restating the code.
3. Pages follow a consistent **Prerequisites → Steps → Test it out → Next Steps** skeleton.
4. Verification is shown concretely (expected JSON response or UI screenshot) at least once per
   page.
5. Each tutorial ends with a working result and an explicit recap tying back to the product's
   differentiators.

NetScript's tutorial chapters generally *meet or exceed* this bar on code density and completeness
(most chapters are 140–225 lines with full files); where they fall short is axis 4 (showcase) and
in which *API* the code demonstrates, not prose mechanics.

## Summary counts

- Pages audited: **113** published pages; 5 eis-chat redirect stubs excluded → **108 scored**.
- Feature-coverage: **87 good / 16 thin / 5 missing**
- Anti-pattern: **86 good / 16 thin (borderline) / 6 missing (confirmed instance)**
- Code:prose balance: **78 good / 24 thin / 6 missing**
- Highlight-feature showcase: **57 good / 37 thin / 14 missing**

Showcase is the weakest axis by a wide margin — consistent with the owner's framing that the
differentiator story, not prose mechanics, is where the docs underperform.

## Headline structural finding (cross-series, grep-verified)

**The frontend typed-route/typed-client/query-hook stack is showcased in exactly one of five
tutorial series.** Across all 33 tutorial chapters:

- `createRouteReference`/`bindRoutePattern`/`defineRouteContract`: 0 hits in chat, storefront,
  workspace, erp-sync (26 chapters); 1 hit in live-dashboard (`04-definePage-QueryIsland.md`).
- `createServiceClient`/`createServiceQueryUtils`/`defineServices`: 0 hits outside live-dashboard.
- `useIslandQuery`/`useLiveQuery`/`useIslandMutation`: 0 hits outside live-dashboard.

A reader who does the chat, storefront, or workspace tutorial never sees `createRouteReference` at
all — even where a dynamic route exists (chat's `[sessionId]`) or where the chapter is literally
titled route-authz (`workspace/05-route-authz.md`). Backend contract discipline is consistently
good (storefront/03's oRPC contracts, erp-sync's import contracts — no raw `req.json()`/manual
`JSON.parse` hits anywhere); the gap is specifically the frontend route layer.

## Confirmed anti-pattern instances (grep-verified, source-checked)

| # | File:line | Snippet | Typed alternative that exists | Verdict |
|---|---|---|---|---|
| 1 | `web-layer/query.md:137,183,248` | `fetch("/api/widgets").then(r => r.json())`, `fetch(\`/api/docs/${id}\`)`, `fetch(\`/api/todos/${todo.id}\`, ...)` as `queryFn`/`mutationFn` | `createServiceClient` + `createServiceQueryUtils` (`packages/sdk`), shown correctly one page over in `web-layer/fresh-ui.md:181` (`exampleServiceQueries.list.queryOptions(...)`) | **Real anti-pattern, highest traffic.** The canonical query-hooks page teaches raw `fetch()` and never mentions the sdk query-utils bridge — the one integration that makes the typed-contract story land. |
| 2 | `tutorials/live-dashboard/04-definePage-QueryIsland.md:103-104` | `ctx.url.searchParams.get('limit')`, `.get('offset')` | `paginationSearchSchema()` from `@netscript/fresh/route` — built for exactly limit/offset (`route/mod.ts`) | **Real anti-pattern.** The chapter's whole point is `definePage`/`QueryIsland`, yet it hand-parses the pagination params the typed schema exists for. |
| 3 | `tutorials/chat/02-durable-chat-route.md:121`, `how-to/build-a-durable-chat.md:122`, `ai/durable-chat.md:80` | `target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! })` | None directly — `createNetScriptChatStreamProxy`'s `target` resolver receives a bare `Request` (`packages/fresh/src/runtime/ai/stream-proxy.ts:93-101`), not `ctx.params` | **Borderline, not fully avoidable — verified.** Worth an explicit callout so it doesn't read as "how NetScript does path params." |
| 4 | `tutorials/chat/03-chat-ui.md:118`, `06-live-streaming.md:96` | `await fetch(\`/api/chat/${sessionId}\`, { method: 'POST' })` | A bound `RouteReference.href()` for the URL (the fetch itself is a legitimate fire-and-forget control call) | **Thin.** Hand-built template URL where the typed href helper exists; minor but it is the tutorial's only URL-construction example. |
| 5 | 8 pages (`services-sdk/services.md:142`, `explanation/contracts.md:125`, `how-to/add-a-service.md:204`, `how-to/expose-openapi-scalar.md:50`, `how-to/customize-fresh-ui.md:97`, `how-to/add-opentelemetry.md:189`, `tutorials/storefront/02:265`, `tutorials/live-dashboard/02:171`) | `port: parseInt(Deno.env.get('PORT') \|\| '3001')` | `netscript.config.ts` types `services.<name>.port` (`packages/config` `defineConfig`) | **Thin, doc-consistency debt — not a hard anti-pattern.** The generated entrypoint genuinely reads env `PORT` (Aspire injects it), but no page explains how the typed config port and the env read relate, so the raw-env line reads as the canonical pattern. |
| 6 | `reference/ai/index.md:330` | Provider API keys via raw `Deno.env.get(...)` | No typed secrets surface exists for AI provider keys (unlike `@netscript/config` for topology) | **Thin feature-coverage — candidate debt entry**, worth an explicit note rather than silence. |
| 7 | `durable-workflows/streams.md:128` (`new EventSource`, `JSON.parse(ev.data)`) and `identity-access/auth.md:165` (browser `fetch` to a public REST auth API) | N/A | **Good, not anti-patterns** — honest architectural constraint / correctly-scoped external REST call. |

## Matrix (non-good cells only; every other scored page is "good" on that axis)

### Tutorials (33 chapters + 5 index pages scored)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `live-dashboard/04-definePage-QueryIsland.md` | good | **missing** (#2) | good | thin — pagination omission dilutes the "typed end-to-end" differentiator in its own flagship chapter |
| `chat/02-durable-chat-route.md` | thin — dynamic `[sessionId]` route never shown typed | thin (#3) | good | good |
| `chat/03-chat-ui.md` | thin — chat UI is where `useIslandQuery`/live queries apply; absent | thin (#4) | good | thin |
| `chat/06-live-streaming.md` | good | thin (#4) | good | good — strong durable-reducer invariant framing |
| `workspace/05-route-authz.md` | thin — route-authz chapter without route contracts | good | good | thin — the single most natural typed-route+auth-guard showcase, unused |
| `chat/index.md`, `storefront/index.md`, `workspace/index.md`, `erp-sync/index.md` | good | good | good | thin — none names a differentiator in its lede (contrast `live-dashboard/index.md`, which does) |
| `storefront/05-shipping-webhook.md`, `06-deploy.md`, `workspace/03-workspace-data.md`, `06-deploy.md`, `erp-sync/05-deploy.md`, `live-dashboard/06-deploy.md` | good | good | good | thin — one-command Aspire deploy story present but understated |
| storefront frontend layer (series-level) | **missing** — cart/checkout is an ideal typed-route+mutation showcase; series never touches it | — | — | **missing** |
| workspace frontend layer (series-level) | **missing** — same gap, sharper given ch. 05's title | — | — | **missing** |
| remaining chapters (chat/01,04,05; storefront/01-04; workspace/01,02,04; erp-sync/01-04; live-dashboard/01-03,05 + index) | good | good | good | good — storefront/04 (saga compensation), erp-sync/03 (polyglot permissions), live-dashboard/03 (`defineServices` walkthrough) are the strongest showcase chapters on the site |

### How-to (26 pages)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `build-a-durable-chat.md` | good | thin (#3) | good | good |
| `add-a-service.md`, `expose-openapi-scalar.md`, `customize-fresh-ui.md`, `add-opentelemetry.md` | good | thin (#5) | good | good |
| `discover-services.md`, `choose-a-queue-provider.md`, `add-a-task-runtime-adapter.md` | thin — decision-matrix prose, short samples | good | thin | thin — pluggability differentiator stated, not demonstrated end-to-end |
| remaining 18 pages | good | good | good | good |

### Reference (31 pages; terse generated tables are the *intended* format, not scored thin for that alone)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `reference/ai/index.md` | thin (#6) | good | good | good |
| `reference/queue/index.md`, `reference/kv/index.md` | thin — no cross-link to `how-to/queue-kv-cron.md`/worked example | good | thin | thin |
| `reference/streams/index.md`, `reference/triggers/index.md` | good | good | thin | thin — durable-by-default framing appears once at top, not reinforced |
| `reference/contracts/index.md` | good | good | good | thin — lede never says typed contracts obviate manual `req.json()` validation |
| `reference/sdk/index.md` | good | good | good | thin — `defineServices()` is "one call wires the whole typed stack" but the lede describes it mechanically |
| remaining 25 pages | good | good | good | good |

### Pillars + explanation (~35 pillar + 8 explanation pages)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `web-layer/query.md` | thin — never mentions `createServiceQueryUtils`/`defineServices` | **missing** (#1) | thin — high code density demonstrating the wrong pattern | **missing** — the typed-contract `queryFn` is the actual differentiator over plain TanStack Query |
| `web-layer/form.md` | good | good | good | thin — forms never connected to typed service mutations (write path) |
| `web-layer/defer-streaming-ui.md`, `error.md` | good | good | good | thin — no framing vs React Suspense/generic error boundaries |
| `web-layer/examples.md`, `interactive.md` | thin — islands primer without the typed query/route integration that makes NetScript islands distinct | good | thin | thin |
| `web-layer/testing.md` | thin — no example of testing a bound route contract's parse functions | good | good | thin |
| `web-layer/vite.md` | good | good | good | missing — build-tooling page; acceptable |
| `ai/index.md` | thin — hub doesn't preview durable-chat/typed-route tie-in | good | thin | thin |
| `ai/chat-ui.md` | good | good | good | thin |
| `ai/durable-chat.md` | good | thin (#3) | good | good — single-reducer invariant + `authorize` warning are strong |
| `ai/mcp.md` | good | good | good | thin — no "beats hand-rolled MCP wiring" framing |
| `services-sdk/services.md`, `explanation/contracts.md` | good | thin (#5) | good | good |
| `identity-access/better-auth-plugins.md` | thin — no full route-protection example at sibling `auth.md`'s depth | good | thin | thin |
| `web-layer/fresh-ui.md`, `services-sdk/sdk.md`, `observability/telemetry.md`, `durable-workflows/index.md`+`sagas.md`, `orchestration-runtime/cli-scaffold.md` | good | good | good | **good — the site's best showcase pages** (copy-source framing; "hand-rolled fetch wrapper tax"; opt-in zero-dep; concrete failure-mode framing) |
| remaining pillar/explanation pages | good | good | good | good |

## Enhancement proposals (actionable, per non-good cell)

1. **`docs/site/web-layer/query.md`** — replace all three raw-`fetch` `queryFn`/`mutationFn`
   examples (L137, L183, L248) with the typed chain: `createServiceClient` →
   `createServiceQueryUtils` → `queryOptions()/mutationOptions()` spread into
   `useIslandQuery`/`useIslandMutation`, matching `web-layer/fresh-ui.md:181`; keep one raw-`fetch`
   example only under an explicit "endpoints without a NetScript contract" heading. Add a "single
   clients file" example (one module exporting `createServiceClient` per service).
2. **`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md`** — replace the manual
   `ctx.url.searchParams.get('limit'/'offset')` block (L103-104) with `paginationSearchSchema()`
   bound via `defineRouteContract`/`bindRoutePattern` (pattern already documented in
   `web-layer/route.md`), noting it is the same schema used site-wide.
3. **`docs/site/tutorials/workspace/05-route-authz.md`** — rebuild the chapter's route example on a
   bound route contract (`createRouteReference` + typed params) with the auth guard layered on top;
   this is the one chapter whose title promises exactly this combination.
4. **`docs/site/tutorials/chat/02-durable-chat-route.md`, `how-to/build-a-durable-chat.md`,
   `ai/durable-chat.md`** — add a one-line callout after the `target: (req) => ...` block:
   the stream-proxy target resolver only sees the raw `Request`, so this is the documented
   exception — elsewhere prefer `createRouteReference`. (One honest callout, applied three times.)
5. **`docs/site/tutorials/chat/03-chat-ui.md:118`, `06-live-streaming.md:96`** — build the POST URL
   from a bound `RouteReference.href({ path: { sessionId } })` instead of a template string.
6. **`docs/site/tutorials/storefront/`** — add one frontend chapter (or extend 03) showing a typed
   cart route + typed checkout mutation via the sdk query utils; cart/checkout is the strongest
   possible typed-end-to-end showcase and the series currently stops at the backend contract.
7. **`docs/site/services-sdk/services.md`, `explanation/contracts.md`, `how-to/add-a-service.md`,
   `expose-openapi-scalar.md`, `customize-fresh-ui.md`, `add-opentelemetry.md`,
   `tutorials/storefront/02`, `tutorials/live-dashboard/02`** — one shared sentence next to the
   first `parseInt(Deno.env.get('PORT') || ...)` occurrence per page explaining that Aspire injects
   `PORT` at runtime and `netscript.config.ts` `services.<name>.port` is the typed source of truth
   the scaffold wires; today the raw env read looks like the recommended pattern.
8. **`docs/site/reference/ai/index.md`** — add an explicit note (or debt entry) that AI provider
   keys currently have no typed config surface and raw `Deno.env.get` is the supported path.
9. **`docs/site/reference/queue/index.md`, `reference/kv/index.md`** — add a "See it live" link
   block to `how-to/queue-kv-cron.md` / `data-persistence/kv-queues-cron.md` after the symbol table.
10. **`docs/site/reference/contracts/index.md`, `reference/sdk/index.md`** — one showcase sentence
    in each lede: contracts obviate manual `req.json()` validation; `defineServices()` wires the
    whole typed client+query stack in one call.
11. **`docs/site/how-to/discover-services.md`, `choose-a-queue-provider.md`,
    `add-a-task-runtime-adapter.md`** — add one runnable end-to-end block per page (full command
    sequence + resulting file) matching `deploy-local-aspire.md`'s density.
12. **`docs/site/identity-access/better-auth-plugins.md`** — add a complete route-protection
    example (real `routes/*.ts` handler gated on session) at `auth.md`'s depth.
13. **`docs/site/web-layer/interactive.md`, `examples.md`, `testing.md`** — connect each to the
    typed surface: interactive/examples should show one `QueryIsland` + typed query island;
    testing should show testing a bound route contract's `parsePath`/`parseSearch`.
14. **`docs/site/web-layer/form.md`** — add one example posting a validated form through a typed
    service mutation (`mutationOptions()`), closing the read/write asymmetry.
15. **`docs/site/durable-workflows/streams.md`** — one sentence reframing "no in-process
    `subscribe()`" as intentional (same HTTP/SSE surface for browser and server consumers).
16. **`docs/site/services-sdk/sdk.md` ↔ `web-layer/query.md` cross-link** — link sdk.md's
    "hand-rolled fetch wrapper tax" sentence to query.md once proposal #1 lands.
17. **Tutorial index ledes** (`chat`, `storefront`, `workspace`, `erp-sync` `index.md`) — copy
    `live-dashboard/index.md`'s move: name the differentiator the series proves in the first
    paragraph. Also: competitor-contrast language ("what this replaces") appears in only 4 of 33
    chapters — add one contrast sentence per series index at minimum.
18. **Deploy chapters** (4 series' final chapters) — surface the one-command
    scaffold-to-running-Aspire story explicitly instead of listing commands without framing.

## TOP-10 ranking by differentiator impact

1. **`web-layer/query.md` raw-`fetch` examples (proposal #1)** — highest-traffic page in the query
   system; currently teaches the exact anti-pattern NetScript's typed contract clients exist to
   eliminate, never names `createServiceQueryUtils`/`defineServices`, and directly contradicts
   `services-sdk/sdk.md`'s own "hand-rolled fetch wrapper tax" pitch on the same site.
2. **Frontend typed-route stack is a one-series showcase (proposals #3, #6)** — grep-verified: 26
   of 33 tutorial chapters never use `createRouteReference` or the typed client/query chain; a
   reader completing chat, storefront, or workspace never sees the flagged differentiator at all.
   Minimum fix: workspace/05-route-authz and a storefront frontend chapter.
3. **`tutorials/live-dashboard/04-definePage-QueryIsland.md` pagination (proposal #2)** — the
   chapter's title *is* the differentiator, and it still hand-parses `searchParams` instead of the
   typed `paginationSearchSchema()` built for this exact case.
4. **Chat-stream-proxy path-param callout (proposal #4)** — three pages repeat the same look-alike
   pattern; source-verified that the API genuinely can't take typed params here, so one honest
   callout applied three times converts a silent look-alike anti-pattern into a documented
   exception.
5. **Cross-link `sdk.md` ↔ `query.md` (proposal #16)** — near-zero-cost fix turning a site-wide
   internal contradiction into pitch reinforcement.
6. **Reference-to-worked-example links + showcase ledes (proposals #9, #10)** — `queue`/`kv`
   reference pages dead-end without linking to the durable-by-default showcase moment;
   `contracts`/`sdk` ledes describe the two biggest typed-stack wins mechanically.
7. **Decision-matrix how-tos need runnable code (proposal #11)** — `discover-services`,
   `choose-a-queue-provider`, `add-a-task-runtime-adapter` are what a skeptical evaluator reads to
   judge "is this really pluggable"; prose-only pages read as unproven claims.
8. **`identity-access/better-auth-plugins.md` full example (proposal #12)** — auth is a top
   framework-choice criterion; a shallower page than sibling `auth.md` undersells a working feature.
9. **PORT/typed-config consistency sweep (proposals #7, #8)** — 8 pages show
   `parseInt(Deno.env.get('PORT'))` with no pointer to the typed `services.<name>.port` config
   field, and `reference/ai` documents raw env for provider keys without flagging it; small
   per-page fixes that stop the docs from teaching raw-env as the canonical pattern.
10. **Standing editorial rule** — every new route/query/stream doc page is checked against "does a
    typed NetScript primitive exist for what this code block does manually" before merge; items
    #1–#3 are all the same failure mode (typed surface exists, doc reaches for the escape hatch),
    and this rule is the highest-leverage way to prevent recurrence.
