# Fork report: 9 pillars (7 non-web/ai) + explanation pages

Scope: background-processing, data-persistence, durable-workflows, identity-access, observability,
orchestration-runtime, services-sdk (index+subpages, 20 files) + explanation/* (8 files). web-layer
and ai pillars are covered by a separate fork report.

## Headline finding: this is the STRONGEST region of the site

Unlike web-layer/query.md and the non-live-dashboard tutorials, **no raw-URL/anti-pattern hits were
found anywhere in this 28-file, ~8075-line set** (grep for `URLSearchParams`, `new URL(req...)`,
`new URL(request...)`, `setInterval(` across all files, including inside `comp.tabbedCode` embedded
code strings — zero hits). These pages are written by people who know the typed surfaces and used
them correctly. The pillar/explanation layer is not where the "known-worst-case" problem lives —
web-layer (frontend islands/routes) is, confirming the owner's framing.

Two pages here are structurally important because they are the missing cross-link target for the
web-layer gap:

- **`services-sdk/sdk.md`** explicitly documents the **L1/L2/L3 layering** (`createServiceClient`
  → `createServiceQueryUtils` "bridge a typed SDK client into oRPC/TanStack frontend query
  utilities" — L177 — → `defineServices()` preset) that `web-layer/query.md` should be showing but
  isn't. This page is the correct canonical source; the fix elsewhere is a cross-link + adopted
  example, not new prose here.
- **`orchestration-runtime/cli-scaffold.md`** opens with "One command — `netscript init` — lays
  down a complete, running backend workspace" (L11) and walks `netscript init my-app --dry-run` →
  `aspire start` → hit an endpoint "in about five minutes" (L163) — this is the single best
  one-command-scaffold-to-Aspire showcase sentence found anywhere in the site and should be the
  template other differentiator-adjacent pages imitate.

## Per-page scores

| Page | feature-coverage | anti-pattern | code:prose | showcase | evidence |
|---|---|---|---|---|---|
| background-processing/index.md | good | good | thin (34 ln, hub) | thin | Pure hub/index, defers to subpages — fine as a hub but adds no showcase itself. |
| background-processing/polyglot-tasks.md | good | good | good | good | Polyglot task runtime (run non-Deno/TS code durably) is a genuine differentiator, clearly framed. |
| background-processing/workers.md | good | good | good | good | 540 lines, 14 code blocks, has "Why not just X" framing (2 hits) — thorough. |
| data-persistence/index.md | good | good | thin (hub) | thin | Hub page. |
| data-persistence/database.md | good | good | good (tabbedCode-based) | thin | Solid Prisma-adapter coverage; differentiator framing understated vs raw Prisma-only setup. |
| data-persistence/kv-queues-cron.md | good | good | good (tabbedCode-based) | good | 3 comparison-language hits; ties KV/queue/cron into one coherent durable-primitives story. |
| durable-workflows/index.md | good | good | thin (hub, 50 ln) | good | Hub, but names sagas/streams/triggers as one durable-workflow family up front — good framing even at hub scale. |
| **durable-workflows/sagas.md** | **good — best page in this set** | good | good | **good** | 539 lines; full `defineSaga(id).durability(tier).state().on().compensate().build()` typestate-builder walkthrough, a "Recovery models, compared" section (L484), and an honest "Why a saga, and why not" section (L506) — exactly the differentiator-with-tradeoffs framing the owner wants. Template-quality page. |
| durable-workflows/streams.md | good | good | good | thin | Durable-stream coverage solid; 1 comparison hit — could state the differentiator vs. raw SSE/WebSocket reconnect handling more directly. |
| durable-workflows/triggers.md | good | good | good (8 code blocks) | good | 505 lines, 2 comparison hits, thorough builder-API coverage. |
| identity-access/index.md | good | good | thin (hub) | thin | Hub page. |
| identity-access/auth.md | good | good | good (tabbedCode) | thin | 14 OAuth provider presets shown, `AuthBackendOperationUnsupportedError` capability-guard pattern is good API-safety modeling, but doesn't contrast against typical hand-rolled OAuth/session code explicitly. |
| identity-access/better-auth-plugins.md | good | good | thin (91 ln) | thin | Short page, functional but minimal differentiator framing. |
| observability/index.md | good | good | thin (hub) | thin | Hub page. |
| observability/telemetry.md | good | good | good (tabbedCode, 514 ln) | thin | Solid `describeTelemetryConfig`/`isTelemetryEnabled`/`withChildSpan`/`recordJobProgress` coverage — but "opt-in zero-dep telemetry" as a named differentiator (no OTel SDK dependency until enabled) is present in substance but not stated as crisply as cli-scaffold.md states its own differentiator. |
| orchestration-runtime/index.md | good | good | thin (hub, 52 ln) | good | 1 comparison hit even at hub scale. |
| **orchestration-runtime/cli-scaffold.md** | good | good | good | **good — best showcase sentence on the site** | See headline above; "one command... in about five minutes" framing is exemplary. |
| orchestration-runtime/runtime-config.md | good | good | good (4 code blocks) | thin | Solid `defineConfig`/runtime-override coverage; no explicit "beats scattered env-var reads" framing. |
| services-sdk/index.md | good | good | thin (hub) | thin | Hub page. |
| **services-sdk/sdk.md** | good | good | good | **good — canonical cross-link target** | See headline above. L1/L2/L3 layering model (`createServiceClient`/query-client bridge/`defineServices`) is the missing piece web-layer/query.md needs. |
| services-sdk/services.md | good | good | good (4 code blocks, 7 comparison-language hits) | good | Highest comparison-language density in the pillar set — reads as intentionally contrastive. |
| explanation/index.md | good | good | thin (hub) | thin | Hub page. |
| explanation/architecture.md | good | good | good | good | Architecture rationale, appropriately conceptual for an explanation page. |
| explanation/aspire.md | good | good | good | good | Explains *why* Aspire (resource graph, local-prod parity) — good complement to cli-scaffold.md's *how*. |
| explanation/auth-model.md | good | good | good | good | Backs identity-access/auth.md's guard pattern with the underlying principal/session model rationale. |
| explanation/contracts.md | good | good | good | good | Explains *why* contract-first (oRPC + Zod) beats runtime-only validation — good conceptual differentiator page, though (per the web-layer fork's finding) the frontend route-contract half of the story isn't cross-linked here. |
| explanation/durability-model.md | good | good | good | good | Backs sagas.md's "Recovery models, compared" section with the underlying T1/T2/T3 tier rationale. |
| explanation/observability.md | good | good | good | good | Rationale for zero-dep opt-in telemetry design. |
| explanation/plugin-system.md | good | good | good | good | Plugin architecture rationale. |

## Concrete gaps (all "thin", none "missing")

1. **Hub/index pages (7 of them: background-processing, data-persistence, durable-workflows,
   identity-access, observability, orchestration-runtime, services-sdk indexes) are all short
   (33-52 lines) and showcase-thin by design** — acceptable as navigation hubs, but each could carry
   one differentiator-framing sentence in its lede (the way durable-workflows/index.md and
   orchestration-runtime/index.md already do) rather than being pure link lists. Concrete fix:
   add one "why this pillar, in one sentence" callout to background-processing/index.md,
   data-persistence/index.md, identity-access/index.md, observability/index.md,
   services-sdk/index.md (5 pages currently missing it; 2 already have it).
2. **`explanation/contracts.md` explains backend contract-first rigor but does not name or link the
   frontend route-contract system** (`createRouteReference`, covered in the web-layer fork report)
   as the other half of the same "contracts everywhere" story. Concrete fix: add a paragraph/xref
   from explanation/contracts.md to `/web-layer/route/` making the front-to-back symmetry explicit
   — this is the natural place to state "NetScript's contract-first discipline runs from the oRPC
   procedure to the Fresh route to the rendered island" as one continuous claim.
3. **`services-sdk/sdk.md`'s L1/L2/L3 bridge is not cross-linked from `web-layer/query.md`** — this
   is really a web-layer-side fix (see that fork's report) but noting it here since the target page
   lives in this scope: sdk.md already has everything needed; it's an under-used asset, not a gap
   in this page itself.
4. **identity-access/auth.md and better-auth-plugins.md** understate the differentiator vs. a
   hand-rolled OAuth callback/session flow — concrete fix: add one sentence contrasting the
   `AuthBackendOperationUnsupportedError` capability-guard pattern against silently-undefined
   behavior in typical DIY auth code.

## Deno doc spot-checks used

`packages/queue`, `packages/kv`, `packages/telemetry`, `packages/config`, `packages/service` mod.ts
(25/19/42/61/43 top-level symbols respectively — all substantially larger than what any single doc
page enumerates, but pages consistently link to `/reference/<pkg>/` for the full surface rather than
inlining it, which is the correct doc-density tradeoff, not a gap). `plugins/sagas`,
`plugins/triggers` root `mod.ts` are thin manifest-only re-exports; the real builder API lives at
`packages/plugin-sagas-core/src/builders/mod.ts` (`defineSaga`, `defineSignal`, `defineQuery`,
`SAGA_DURABILITY_TIERS`, `CASCADED_MESSAGE_KINDS`) — confirmed durable-workflows/sagas.md documents
this exact set correctly (cross-checked builder methods against page L185-239).

Report ends. Feeds parent's docs-audit-662 report; not a standalone deliverable.
