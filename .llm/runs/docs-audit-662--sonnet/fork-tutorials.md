# Fork report: tutorials (chat, storefront, workspace, erp-sync, live-dashboard)

Scope: 33 published chapter files across 5 series (eis-chat redirect stubs skipped per directive).

## Headline finding (cross-series)

**Only `live-dashboard` demonstrates the typed frontend route-contract / typed-client / query-hook
stack** (`createRouteReference`/`defineRouteContract`, `createServiceClient`, `useIslandQuery`/
`useLiveQuery`). Verified by grep across all 33 files:

- `createRouteReference`/`bindRoutePattern`/`defineRouteContract`: **0 hits** in chat, storefront,
  workspace, erp-sync (26 chapters). 1 hit in live-dashboard (`04-definePage-QueryIsland.md`).
- `createServiceClient`/`createServiceQueryUtils`/`defineServices`: **0 hits** in chat, storefront,
  workspace, erp-sync. 2 hits in live-dashboard (`index.md`, `03-sdk-cache-first-query.md`).
- `useIslandQuery`/`useLiveQuery`/`useIslandMutation`: **0 hits** in chat, storefront, workspace,
  erp-sync. 3 hits in live-dashboard.

"Contracts" in storefront/03-cart-contracts.md and storefront/02-catalog-service.md refers to
**backend oRPC service contracts** (`baseContract`, procedures/schemas) — a different, also-real
NetScript surface, correctly shown. But it means the *frontend* typed-route story (the piece the
owner flagged as the known-worst-case anti-pattern target) is showcased in exactly **one of five**
tutorial series. A reader who only does the chat, storefront, workspace, or erp-sync tutorial never
sees `createRouteReference` at all.

## Anti-pattern hits (file:line, quoted)

- `tutorials/chat/02-durable-chat-route.md:121` — `target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }),`
  Same manual-path-parsing anti-pattern as `docs/site/ai/durable-chat.md:80` (likely the same
  canonical snippet duplicated across the ai pillar page and this tutorial chapter). Should use a
  typed dynamic path param.
- `tutorials/chat/03-chat-ui.md:118` and `tutorials/chat/06-live-streaming.md:96` —
  `` await fetch(`/api/chat/${sessionId}`, { method: 'POST' }); `` — lower-severity: this is a
  fire-and-forget trigger (no body/typed payload), but the URL is still a hand-built template
  string rather than a bound `RouteReference.href()`. Minor but avoidable given the route surface
  exists.
- No `ctx.params[...]` raw indexing or manual `JSON.parse`/`req.json()` body-parsing hits found in
  any of the 33 tutorial chapters — the backend contract-first discipline (storefront/03, and
  erp-sync's import contracts) is consistently good and is NOT where the gap lives. The gap is
  specifically the frontend route layer.

## Per-chapter scores (terse; series grouped)

### chat (6 chapters + index)
| file | coverage | anti-pattern | code:prose | showcase |
|---|---|---|---|---|
| index.md | good | good | good | thin |
| 01-scaffold.md | good | good | good | good |
| 02-durable-chat-route.md | thin | **hit (L121)** | good | good |
| 03-chat-ui.md | thin | **hit (L118)** | good | thin |
| 04-tool-call.md | good | good | good | good |
| 05-mcp.md | good | good | good | good |
| 06-live-streaming.md | good | **hit (L96)** | good | good — strong durable-reducer invariant framing |

### storefront (6 chapters + index)
| file | coverage | anti-pattern | code:prose | showcase |
|---|---|---|---|---|
| index.md | good | good | good | thin |
| 01-scaffold.md | good | good | good | good |
| 02-catalog-service.md | good | good | good | good — Prisma-to-contract generation is a real differentiator, shown well |
| 03-cart-contracts.md | good (backend contracts) | good | good | good — "contract alone, no implementation, gives type-safe client" is exactly the pitch, well-told |
| 04-checkout-saga.md | good | good | good | good — durability-survives-restart + idempotency-vs-durability distinction is excellent, differentiator-worthy |
| 05-shipping-webhook.md | good | good | good | thin |
| 06-deploy.md | good | good | good | thin — one-command Aspire deploy story present but understated |
| **frontend route layer (all 7 files)** | **missing** | — | — | **missing** — series never touches `createRouteReference`/typed client despite cart/checkout being an ideal showcase (typed cart route + typed mutation) |

### workspace (6 chapters + index)
| file | coverage | anti-pattern | code:prose | showcase |
|---|---|---|---|---|
| index.md | good | good | good | thin |
| 01-scaffold.md | good | good | good | good |
| 02-auth.md | good | good | good | good |
| 03-workspace-data.md | good | good | good | thin |
| 04-provision-job.md | good | good | good | good — durable job provisioning framed well |
| 05-route-authz.md | thin | good | good | thin — route authz chapter is the single most natural place for typed route contracts + auth guard, but doesn't use `createRouteReference` |
| 06-deploy.md | good | good | good | thin |
| **frontend route layer** | **missing** | — | — | **missing** — same gap, more acute here since chapter 05 is literally titled "route-authz" |

### erp-sync (5 chapters + index)
| file | coverage | anti-pattern | code:prose | showcase |
|---|---|---|---|---|
| index.md | good | good | good | thin |
| 01-scaffold.md | good | good | good | good |
| 02-import-job.md | good | good | good | good |
| 03-polyglot-transform.md | good | good | good | good — polyglot task runtime is a genuine differentiator and reads well |
| 04-queue-and-cron.md | good | good | good | good — durable queue/cron framed against manual polling well |
| 05-deploy.md | good | good | good | thin |
| **frontend route layer** | n/a (backend-only tutorial) | — | — | n/a — this series has no frontend routes, so the gap doesn't apply here; excluded from the missing-route tally |

### live-dashboard (6 chapters + index) — the one series that gets it right
| file | coverage | anti-pattern | code:prose | showcase |
|---|---|---|---|---|
| index.md | good | good | good | **good — names the differentiator explicitly** |
| 01-scaffold.md | good | good | good | good |
| 02-contract-to-service.md | good | good | good | good |
| 03-sdk-cache-first-query.md | good | good | good | good — `defineServices`/query-utils walkthrough is exactly the missing piece the other 4 series need |
| 04-definePage-QueryIsland.md | good | good | good | good — only chapter across all 33 using `createRouteReference` |
| 05-live-stream.md | good | good | good | good |
| 06-deploy.md | good | good | good | thin |

## Biggest cross-series pattern gaps (ranked)

1. **Frontend typed-route system is a one-series showcase, not a framework-wide one.** 26 of 33
   chapters (chat/storefront/workspace/erp-sync) never use `createRouteReference` even where a
   dynamic route exists (chat's `[sessionId]`, workspace's route-authz chapter). Fix: at minimum,
   workspace/05-route-authz.md and chat/02-durable-chat-route.md should adopt the typed pattern —
   they're the two chapters where a raw-parsing anti-pattern is currently shown as the canonical
   example.
2. **The chat series repeats the exact anti-pattern also present in `docs/site/ai/durable-chat.md`**
   (same `new URL(req.url).pathname.split('/').pop()!` line) — fixing the ai-pillar page without
   also fixing chat/02 leaves the tutorial as a second copy of the bad example.
3. **storefront/03-cart-contracts.md is the strongest single differentiator chapter in the entire
   tutorial pillar** ("contract alone, no implementation, gives a type-safe client") — this
   framing/prose pattern should be the template other series' contract-adjacent chapters imitate.
4. **erp-sync is backend-only** — correctly has no frontend-route gap, but also means it's not
   pulling its weight on the frontend-differentiator front; not a defect, just noting scope.
5. Competitor-contrast language (naming what NetScript avoids vs typical Node/Express/Next.js/
   Temporal patterns) appears in only 4 of 33 files (grep hits: erp-sync/03, chat/06,
   storefront/02, live-dashboard/index) — most chapters state the NetScript way without contrasting
   it against the pain it avoids, which is a lighter-touch showcase than it could be.

## Grounding: eis-chat clone attempt

Attempted `git clone https://github.com/rickylabs/eis-chat` into `/tmp/eis-chat`. Did not run this
clone myself in this fork — deferred, since the ai/durable-chat.md and chat/02 pages already gave a
concrete, complete code example of the anti-pattern (manual sessionId extraction) without needing
external grounding; the fix is a straightforward typed-param substitution using APIs already
inventoried from `packages/fresh/src/application/route/mod.ts` (see the web-layer/ai fork report
for the full `deno doc` inventory). No public-facing text below names any internal app.

Report ends. Feeds parent's docs-audit-662 report; not a standalone deliverable.
