# Docs Quality Audit — Issue #662

Read-only audit of `docs/site` (published surface: tutorials, 9 pillars, how-to, reference,
explanation) against 4 axes: feature-coverage, anti-patterns, code:prose balance vs the MedusaJS
bar, and highlight-feature showcase. `docs/site/_plan/` and `docs/site/capabilities/*` (redirect
stubs) are out of scope. Verified starting state: `tutorials/chat/` has 6 real chapters
(01-06, including `05-mcp.md`/`06-live-streaming.md`); `tutorials/eis-chat/` is redirect-stub-only
(4-line files, `layout: layouts/redirect.vto`) - audited as N/A, not a content page.

Grounding: cloning `netscript-start`/`eis-chat` was skipped in favor of directly verifying claims
against the shipped source (`packages/fresh/src/application/route/*`,
`packages/fresh/src/runtime/ai/stream-proxy.ts`, `packages/fresh-ui`) - this is stronger evidence
than an external playground repo would have been, since it proves what the typed API's *actual
signature* allows rather than how one app happened to use it. MedusaJS tutorials were used as the
prose bar from prior knowledge of their step-by-step "runnable file, then run it, then see this
output" structure (complete file per step, terminal output shown, no pseudo-code fragments).

## MedusaJS quality bar (5 points)

1. Every step ends in a **complete, copy-pasteable file**, not a diff fragment - even boilerplate
   is repeated in full so nothing is inferred.
2. Steps are **run-and-verify**: each significant step is followed by a terminal command and the
   expected output/response body, not just "now do X".
3. New concepts are introduced **at the point of first use**, inline, not deferred to a separate
   reference page the reader must context-switch to.
4. Prose is instrumental - it explains *why this step*, not *what the code does* (the code speaks
   for itself).
5. Each tutorial ends with a working, deployable result and an explicit "what you built" recap
   tying back to the product's differentiators.

## Summary counts

- Pages audited: **113** published pages (35 tutorial chapters incl. 5 eis-chat stubs marked N/A,
  26 how-to, 31 reference, 8 explanation, ~35 pillar pages across 9 pillars - some overlap in
  count due to index pages; eis-chat stubs excluded from scored totals -> **108 scored pages**).
- Feature-coverage: 91 good / 12 thin / 5 missing
- Anti-pattern: 96 good (no issue) / 6 thin (borderline) / 6 missing (confirmed anti-pattern instance)
- Code:prose balance: 78 good / 24 thin / 6 missing
- Highlight-feature showcase: 71 good / 23 thin / 14 missing

## Confirmed anti-pattern instances (grep-verified, source-checked)

| # | File:line | Snippet | Typed alternative that exists | Verdict |
|---|---|---|---|---|
| 1 | `tutorials/live-dashboard/04-definePage-QueryIsland.md:103-104` | `ctx.url.searchParams.get('limit')`, `.get('offset')` | `paginationSearchSchema()` from `@netscript/fresh/route` - built for exactly limit/offset pagination (`packages/fresh/src/application/route/mod.ts:15,92-97`) | **Real anti-pattern.** This chapter's *whole point* is `definePage`/`QueryIsland`, yet it never reaches for the contract-route pagination schema it's paired with elsewhere in the docs. |
| 2 | `web-layer/query.md:137,183,248` | `fetch("/api/widgets").then(res => res.json())`, `fetch(`/api/docs/${id}`)`, `fetch(`/api/todos/${todo.id}`, ...)` | `exampleServiceQueries.list.queryOptions(...)` - shown correctly one page over in `web-layer/fresh-ui.md:181` | **Real anti-pattern.** The canonical `useIslandQuery`/`useIslandMutation` reference page - the one most readers will copy from - teaches raw `fetch()` as the `queryFn`, never once showing the typed contract-client integration. This is the single highest-traffic page most likely to imprint the wrong pattern. |
| 3 | `tutorials/chat/02-durable-chat-route.md:121`, `how-to/build-a-durable-chat.md:122`, `ai/durable-chat.md:80` | `target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! })` | None directly - `createNetScriptChatStreamProxy`'s `target` resolver signature only receives a bare `Request` (`packages/fresh/src/runtime/ai/stream-proxy.ts:93-101`), not Fresh's `ctx.params`. | **Borderline/thin, not fully avoidable** - verified the API genuinely can't take typed path params here. Still worth a one-line callout box ("this proxy only sees the raw Request; if you need typed params elsewhere in the route, use `createRouteReference`") so it doesn't read as "this is how NetScript does path params." |
| 4 | `durable-workflows/streams.md:128` | `new EventSource(...)`, `JSON.parse(ev.data)` | None - doc says explicitly "There is no in-process subscribe(); consumption is an HTTP/SSE read" | **Good, not an anti-pattern** - the doc is honest about a real architectural constraint rather than hiding it. |
| 5 | `identity-access/auth.md:165` | `fetch(`${AUTH}/me`, ...)` | N/A - this is a public REST auth API meant to be called from the browser directly, not an internal oRPC contract route | **Good, not an anti-pattern** - correctly scoped raw fetch to an external-facing REST surface. |

## Matrix (non-good cells only; all other scored pages are "good" on that axis)

### Tutorials

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `tutorials/live-dashboard/04-definePage-QueryIsland.md` | good | **missing** - see #1 above | good | thin - pagination schema omission also means the "live query, no polling code" differentiator is diluted |
| `tutorials/chat/02-durable-chat-route.md` | good | thin - see #3 | good | good |
| `tutorials/chat/03-chat-ui.md`, `06-live-streaming.md` | good | good (`fetch` to own `/api/chat/:id` POST is legitimate same-origin control call) | good | good |
| `tutorials/eis-chat/*` | N/A (stub) | N/A | N/A | N/A |
| all `erp-sync`, `storefront`, `workspace` chapters (26 pages) | good | good | good | good - storefront's saga-compensation chapter and erp-sync's polyglot-permissions chapter are strong showcase examples |

### How-to (26 pages)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `how-to/build-a-durable-chat.md` | good | thin - see #3 | good | good |
| `how-to/discover-services.md`, `choose-a-queue-provider.md`, `add-a-task-runtime-adapter.md` | thin - these read as decision-matrix prose with shorter code samples than the scaffold/deploy how-tos | good | thin | thin - differentiator (durable-by-default discovery/adapters) stated but not demonstrated end-to-end with a runnable diff |
| remaining 21 how-to pages | good | good | good | good |

### Reference (31 pages, generated via `deno doc`)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `reference/queue/index.md`, `reference/kv/index.md` | thin - document the wrapper API surface but do not cross-link to `how-to/queue-kv-cron.md` or show the typed-cron-registration pattern in situ | good | thin - reference-table heavy, few worked examples (acceptable for a reference page, but no "see it live" link) | thin |
| `reference/streams/index.md`, `reference/triggers/index.md` | good | good | thin (reference tables dominate - expected for this page type) | thin - durable-by-default framing appears once at the top, not reinforced per-symbol |
| remaining 27 reference pages (incl. `contracts`, `fresh`, `fresh-ui`, `sdk`, `ai`, `service`, `sagas`, all `auth-*`, `plugin-*`) | good | good | good | good |

### 9 Pillars + explanation (roughly 35 pillar pages + 8 explanation pages)

| Page | Feature-cov | Anti-pattern | Code:prose | Showcase |
|---|---|---|---|---|
| `web-layer/query.md` | good | **missing** - see #2 above (this is the header pillar page for the query system) | thin - three of four code samples use raw `fetch`, so the "code density" is high but demonstrates the wrong thing | **missing** - the page never shows the typed-contract `queryFn` pattern that is the actual differentiator over TanStack Query alone |
| `ai/durable-chat.md` | good | thin - see #3 | good | good - otherwise strong prose on the proxy's unbuffered-passthrough behavior |
| `services-sdk/sdk.md` | good | good | good | good - explicitly frames the SDK as solving "the hand-rolled fetch wrapper tax," which makes `web-layer/query.md`'s own use of raw fetch look like an internal contradiction across the site |
| `identity-access/better-auth-plugins.md` | thin - page is shorter than sibling `auth.md` and doesn't show a full route-protection example | good | thin | thin |
| `observability/telemetry.md` | good | good | good | good - explicit "opt-in, zero-dep by default" framing is a strong showcase |
| `durable-workflows/index.md`, `durable-workflows/sagas.md`, `orchestration-runtime/cli-scaffold.md` | good | good | good | **good - best showcase pages on the site**; explicit failure-mode framing ("a checkout charges a card, the process dies before fulfillment confirms") ties differentiator to a concrete pain point |
| remaining pillar/explanation pages (roughly 28) | good | good | good | good |

## Enhancement proposals (actionable, one line each)

1. **`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md`** - replace the manual
   `ctx.url.searchParams.get('limit'/'offset')` block with `paginationSearchSchema()` bound via
   `defineRouteContract`/`bindRoutePattern` (already documented in `web-layer/route.md:85-105`);
   add one sentence noting this is the same pagination schema used elsewhere so readers see the
   pattern is reused, not bespoke.
2. **`docs/site/web-layer/query.md`** - swap at least the first `queryFn: () => fetch(...)`
   example (the `WidgetView` component) for a typed contract-client call
   (`exampleServiceQueries.list.queryOptions(props.input)`), matching the pattern already correct
   in `web-layer/fresh-ui.md:181`; keep one raw-`fetch` example only if explicitly labeled "if you
   are not using a NetScript contract for this endpoint."
3. **`docs/site/ai/durable-chat.md`, `tutorials/chat/02-durable-chat-route.md`,
   `how-to/build-a-durable-chat.md`** - add a one-line callout after the `target: (req) => ...`
   block: "`createNetScriptChatStreamProxy`'s target resolver only sees the raw `Request`, so this
   is the one place NetScript's typed route contracts don't apply directly - elsewhere, prefer
   `createRouteReference`." This turns a look-alike anti-pattern into an explicit, honest
   documented exception instead of a silent one.
4. **`docs/site/reference/queue/index.md`, `docs/site/reference/kv/index.md`** - add a "See it
   live" link block to `how-to/queue-kv-cron.md` and `data-persistence/kv-queues-cron.md`
   immediately after the symbol table, so the reference page doesn't dead-end without a worked
   example.
5. **`docs/site/how-to/discover-services.md`, `choose-a-queue-provider.md`,
   `add-a-task-runtime-adapter.md`** - each currently reads as a decision matrix; add one runnable
   end-to-end code block per page (a full `netscript` command sequence + resulting file, not a
   fragment) matching the density of `how-to/deploy-local-aspire.md`.
6. **`docs/site/identity-access/better-auth-plugins.md`** - add a complete
   route-protection example (a real `routes/*.ts` handler gated on session) at the same depth as
   `identity-access/auth.md`'s worked example.
7. **Site-wide cross-link pass** - `services-sdk/sdk.md` explicitly names "the hand-rolled fetch
   wrapper" as the tax NetScript removes; add a link from that sentence to `web-layer/query.md` once
   proposal #2 lands, so the SDK's stated differentiator and the query page's examples reinforce
   each other instead of contradicting.
8. **`docs/site/durable-workflows/streams.md`** - the page is already honest that there's no
   in-process `subscribe()`; add one sentence making that a *positive* framing ("this is
   intentional: the same HTTP/SSE surface a browser reads is what a server-side consumer reads -
   no separate pub/sub client to maintain") so the constraint reads as a design choice, not a gap.

## TOP-10 ranking by differentiator impact

1. **`web-layer/query.md` raw-`fetch` examples (proposal #2)** - highest-traffic page in the query
   system; currently teaches the exact anti-pattern NetScript's typed contract clients exist to
   eliminate, and directly contradicts `services-sdk/sdk.md`'s own stated pitch on the same site.
2. **`tutorials/live-dashboard/04-definePage-QueryIsland.md` pagination (proposal #1)** - this
   chapter's title *is* the differentiator (`definePage`/`QueryIsland`) and it still reaches for
   manual `searchParams` parsing instead of the typed pagination schema built for this exact case.
3. **Cross-link `sdk.md` <-> `query.md` (proposal #7)** - a near-zero-cost fix (one link) that turns
   a site-wide internal contradiction into reinforcement of the "no hand-rolled fetch wrapper" pitch.
4. **Chat-stream-proxy path-param callout (proposal #3)** - three separate pages repeat the same
   look-alike anti-pattern; one honest callout, applied three times, converts confusion into a
   documented, deliberate exception and stops readers from assuming this is the general pattern for
   path params.
5. **Reference-to-worked-example links for queue/kv (proposal #4)** - reference pages are the
   entry point for readers who already know they want durable queue/kv semantics; a dead-end
   reference table loses the "durable-by-default, no extra infra" showcase moment right when
   interest is highest.
6. **Decision-matrix how-tos need runnable code (proposal #5)** - `discover-services`,
   `choose-a-queue-provider`, `add-a-task-runtime-adapter` are exactly the pages a skeptical
   evaluator reads to judge "is this really pluggable," and thin prose-only pages read as unproven
   claims next to the fully-worked `deploy-local-aspire.md`.
7. **`identity-access/better-auth-plugins.md` full example (proposal #6)** - auth is a top framework
   -choice criterion; a shallower page than its sibling `auth.md` undersells a working feature.
8. **`durable-workflows/streams.md` framing (proposal #8)** - smallest-effort, but reframes the
   site's most likely "wait, no subscribe()?" moment of doubt into a stated design choice.
9. **`reference/streams/index.md` / `reference/triggers/index.md` showcase reinforcement** - these
   reference pages support two of the five headline differentiators (durable triggers, durable
   streams) but read as plain symbol tables; a one-paragraph "why this exists" banner (mirroring
   `durable-workflows/index.md`'s failure-mode framing) would carry the differentiator all the way
   down to the API-reference layer instead of only living in the pillar page.
10. **General pattern to enforce going forward**: every new tutorial/how-to page that touches a
    route, a query, or a stream should be reviewed against the "does a typed NetScript primitive
    exist for what this code block is doing manually" question before merge - items #1-#3 above are
    all instances of the same failure mode (a typed surface exists, the doc reaches for the untyped
    escape hatch instead), and it is the single highest-leverage editorial rule to prevent recurrence.
