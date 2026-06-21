# NetScript Documentation — Information Architecture v3

**Status:** proposed (PLAN-EVAL gated) · supersedes `doc-architecture-v2.md` · baselined to `origin/main` @ `5f273355`
**Goal:** production-grade public docs matching Medusa / Astro / Laravel / TanStack quality.
**Deploy target (later, separate gated run):** `docs/user-site` → Pages (`pages.yml`, `paths: docs/site/**`).

This document is the **locked structural contract** for the overhaul. It defines the sitemap, page
roster, component & diagram system, cross-reference system, and the migration from the currently
deployed v3 site. It does **not** contain doc prose; a later authoring run consumes this IA + the
accuracy dossiers.

---

## 0. Principles

1. **Diátaxis** as the spine: Tutorials (learning) · How-to (task) · Explanation (understanding) ·
   Reference (information). Plus a **Capabilities** layer of Medusa-style hubs that triangulate the
   three for each framework feature.
2. **Every shipped public surface has a discoverable home.** No first-class capability lives only as a
   prose paragraph inside another page (the v3 "Fresh framework buried under Fresh UI" failure).
3. **Public voice only.** Zero internal/agent/harness speech anywhere in `docs/site/**`.
4. **Accuracy never regresses.** The 3 v3 accuracy dossiers are the truth floor.
5. **Reference is generated, not authored** (`deno doc`, `reference/**`) — linked, never hand-edited.
6. **Progressive disclosure**: front door → capability hub → (learn | do | understand | reference).

---

## 1. Global IA tree (proposed)

```
/                                   Start here (front door)
├─ /                                 Home / hero / value prop / capability grid
├─ /why                              Why NetScript (positioning, comparisons)
├─ /quickstart                       0→running in <10 min (scaffold + run)
├─ /concepts                         The 5-minute mental model (contracts-first, plugins, runtime)
│
├─ /tutorials/                       LEARNING — multiple independent tracks (D1)
│  ├─ index                          Track chooser ("pick your path")
│  ├─ storefront/                    Track A — e-commerce checkout (focus: sagas/payments)
│  │  ├─ 01-scaffold … 06-deploy
│  ├─ workspace/                     Track B — team workspace SaaS (focus: auth + multi-tenant data)
│  │  ├─ 01 … 06
│  ├─ erp-sync/                      Track C — ERP integration (focus: jobs + polyglot tasks)
│  │  ├─ 01 … 05
│  └─ live-dashboard/               Track D — internal live dashboard (focus: Fresh + SDK + streams)
│     ├─ 01 … 05
│
├─ /capabilities/                    UNDERSTAND+DO hubs (one per framework feature)
│  ├─ index                          Capability grid (Learn/Do/Reference triplet per card)
│  ├─ services                       oRPC services + OpenAPI/Scalar + health + graceful shutdown
│  ├─ background-jobs                Workers/jobs, runtime modes (in-process/web-worker/subprocess)
│  ├─ polyglot-tasks   ★NEW          deno/python/dotnet/shell/cmd/powershell/exe + permissions
│  ├─ durable-sagas                  sagas + stores + presets/middleware/transports/agent
│  ├─ triggers                       webhooks/event triggers
│  ├─ streams                        durable streams producer→server→consumer
│  ├─ kv-queues-cron                 KV, queue providers (KV/Redis/RabbitMQ/Postgres), cron
│  ├─ database                       Prisma + adapters (postgres/mssql/mysql), tracing, per-plugin schema
│  ├─ fresh-framework  ★NEW          @netscript/fresh meta-framework (route/form/defer/query/…)
│  ├─ fresh-ui                       Design system / UI kit / copy-source components
│  ├─ sdk             ★NEW           @netscript/sdk (client/discovery/cache/collections/query-client)
│  ├─ runtime-config  ★NEW           runtime overrides / config model
│  ├─ telemetry                      OTel across jobs/sagas/services/auth
│  └─ auth                           plugin backends + service middleware seam + audit observability
│
├─ /how-to/                          TASK recipes (problem → steps → result)
│  ├─ index
│  ├─ add-a-service · add-a-plugin · add-authentication (existing, kept)
│  ├─ run-a-polyglot-task   ★NEW     Python/shell/dotnet/powershell task + permissions
│  ├─ choose-a-queue-provider ★NEW   KV vs Redis vs RabbitMQ vs Postgres
│  ├─ use-a-second-database  ★NEW    mssql / mysql adapter
│  ├─ discover-services      ★NEW    @netscript/sdk/discovery in app code
│  ├─ expose-openapi-scalar  ★NEW    createOpenAPISpec / createScalarDocs
│  ├─ graceful-shutdown      ★NEW    ShutdownHook drain on deploy
│  ├─ tune-worker-runtime    ★NEW    in-process vs web-worker vs subprocess
│  ├─ deploy-to-production   ★NEW    Aspire → prod checklist (health, drain, env)
│  └─ … (existing recipes kept)
│
├─ /explanation/                     UNDERSTANDING (concept essays)
│  ├─ architecture          ★NEW     plugins, packages, runtime, thread isolation
│  ├─ contracts-first                why contracts drive everything
│  ├─ durability-model      ★NEW     sagas/streams/jobs durability + compensation semantics
│  ├─ auth-model                     (existing, kept)
│  ├─ plugin-system         ★NEW     plugin↔package boundary, archetypes (public-facing framing)
│  └─ observability         ★NEW     OTel model end-to-end
│
├─ /reference/                       GENERATED (deno doc) — linked only, never authored
│
├─ /glossary
└─ /cli-reference                    full CLI surface (add: db add, marketplace publish|search)
```

`★NEW` = net-new page/zone vs deployed v3. Existing pages without a mark are kept (and may be enriched
per §4/§6) but not restructured.

---

## 2. Capability hub pattern (Medusa-style triplet)

Every `/capabilities/<x>` hub follows one template so the site feels uniform:

```
<Capability name>            ← H1 + one-sentence definition + status badge(s)
 ├─ What it is               ← 3–5 sentence explanation (links to /explanation/* for depth)
 ├─ Learn  →                 ← links to the tutorial track(s)/chapters that teach it
 ├─ Do     →                 ← links to the how-to recipes for it
 ├─ Key concepts             ← short prose with ONE diagram (see §5)
 ├─ Minimal example          ← smallest correct, runnable snippet (code-copy enabled)
 ├─ Options / API table      ← key options as a table (apiTable component)
 └─ Reference →              ← link to generated /reference/<unit>
```

This converts the current flat capability pages into discoverable Learn/Do/Reference triplets and is
the single biggest "matches other frameworks" lever.

---

## 3. Tutorials — multiple independent tracks (D1/D2)

Replaces the single linear 5-rung ladder. Four self-contained tracks, each a **different real app**
emphasizing a different capability cluster. `/tutorials/index` is a "pick your path" chooser. Tracks
do **not** depend on each other; each starts from `netscript create`. (App rosters validated against
the `netscript-start/apps/playground` showcase — see grounding `ground/playground-showcase-map.md`.)

| Track | App | Capability focus | Chapters (proposed) |
|-------|-----|------------------|---------------------|
| **A — Storefront** | E-commerce checkout | Services, contracts, **durable sagas** (payment+inventory compensation), triggers (webhooks), auth (customer/admin) | 01-scaffold · 02-catalog-service · 03-cart-contracts · 04-checkout-saga · 05-shipping-webhook · 06-deploy |
| **B — Team Workspace** | Multi-tenant SaaS | **Auth** (multi-backend, orgs), services, **database** (per-plugin schema, second DB), provisioning jobs | 01-scaffold · 02-auth-and-orgs · 03-workspace-data · 04-provision-job · 05-roles-and-middleware · 06-deploy |
| **C — ERP Sync** | Back-office integration | **Background jobs** + **polyglot tasks** (python/shell/dotnet), queue providers, cron/triggers | 01-scaffold · 02-import-job · 03-polyglot-transform · 04-queue-and-cron · 05-deploy |
| **D — Live Dashboard** | Internal ops dashboard | **Fresh meta-framework** (builders/route/form/query/defer/interactive) + **SDK** (client/discovery/cache/collections/query-client) + **durable streams** (live data) | 01-scaffold · 02-contract-to-service · 03-sdk-cache-first-query · 04-definePage-QueryIsland · 05-live-stream (`useLiveQuery`) · 06-deploy |

Each chapter is a **page-type B** (sequential tutorial step) with prev/next continuity, a result
checkpoint, and a "you built" summary. Every track ends in a `deploy` chapter that links the
production how-to + checklist.

---

## 4. Feature homes for verified-but-undocumented surface (§4 of research)

The IA explicitly assigns every verified gap a home so nothing is left as orphan prose:

| Gap (verified on origin/main) | Home in v3 IA |
|-------------------------------|---------------|
| `@netscript/fresh` 12-subpath meta-framework | `capabilities/fresh-framework` (hub) + Track D + explanation/architecture |
| `@netscript/sdk` discovery/cache/collections/query-client | `capabilities/sdk` (hub) + `how-to/discover-services` + Track D |
| Polyglot runtimes (cmd/powershell/dotnet/exe) + permissions model | `capabilities/polyglot-tasks` (hub) + `how-to/run-a-polyglot-task` + Track C |
| Worker runtime modes (in-process/web-worker/subprocess) | `capabilities/background-jobs` (enrich) + `how-to/tune-worker-runtime` |
| DB `mssql`/`mysql` adapters + `tracing` | `capabilities/database` (enrich) + `how-to/use-a-second-database` |
| Saga `presets`/`middleware`/`transports`/`agent`/`integration` | `capabilities/durable-sagas` (enrich, "extending sagas" section) |
| Service shutdown hooks / OpenAPI+Scalar / health primitives | `capabilities/services` (enrich) + `how-to/graceful-shutdown` + `how-to/expose-openapi-scalar` |
| Queue providers (KV/Redis/RabbitMQ/Postgres) | `capabilities/kv-queues-cron` (enrich) + `how-to/choose-a-queue-provider` |
| `runtime-config` package | `capabilities/runtime-config` (hub) + `explanation/architecture` |
| CLI: `db add`, `marketplace publish\|search` | `cli-reference` (enrich) |

---

## 5. Design system & rendered diagrams (D3 — full scope)

Centrally-owned surfaces (`base.vto`, `styles/`, `_components/*.vto`, `_data.ts`) are **in scope**.
All additions must be additive and backward-compatible with existing pages.

### 5.1 New shared components
| Component | Purpose | Owner surface |
|-----------|---------|---------------|
| In-site search | Pagefind index + search box in `base.vto` header | `base.vto`, build pipeline |
| On-page TOC | right-rail auto-TOC (IntersectionObserver highlight) | `base.vto`, `styles/` |
| Code-copy button | per code-block clipboard button | `_components/` + `styles/` |
| `comp.diagram` | renders Mermaid (see §5.2) with a static fallback | new `_components/diagram.vto` |
| `comp.fileTree` | project file-tree rendering (for scaffold/tutorials) | new `_components/fileTree.vto` |
| `comp.badge` | status/feature badges (Stable/Alpha/Deno-native/oRPC) | new `_components/badge.vto` |
| `comp.cardsGrid` | capability/track card grids (front door, hub indexes) | new `_components/cardsGrid.vto` |
| prev/next nav | sequential nav for tutorial chapters | `base.vto` + `_data.ts` track ordering |
| "Was this helpful" | lightweight feedback widget (optional, P2) | `_components/` |

### 5.2 Diagram system
- **Tooling:** Mermaid (rendered client-side or at build), wrapped by `comp.diagram` with an accessible
  static fallback. ASCII diagrams in current pages are replaced where they map to a §5.3 entry.
- Avoid the Vento `function`-keyword landmine in any code sample passed to comp tags
  ([[lume-vento-function-keyword-landmine]]): use arrow/const forms.

### 5.3 Diagram inventory (from grounding `ground/leakage-diagram-barraising.md`)
Minimum set the build run must produce (target page in parens): overall architecture
(explanation/architecture) · request lifecycle contract→handler→client→island (capabilities/services)
· saga state machine + compensation (durable-sagas) · plugin thread-isolation model
(explanation/architecture) · queue→worker→scheduler flow (kv-queues-cron) · polyglot task execution
(polyglot-tasks) · Aspire resource graph (quickstart/deploy) · auth flow backends+middleware (auth) ·
streams producer→server→consumer (streams) · DB per-plugin schema aggregation (database) · scaffold
project file-tree (quickstart + tutorial 01s, via `comp.fileTree`).

---

## 6. Cross-reference system (W6 — auto-resolving xref)

Replaces hand-maintained internal links. Design:
- A single `xref` data source (`_data.ts` or a `_data/xref.ts`) maps stable **keys** →
  canonical URLs (e.g. `cap:durable-sagas`, `howto:run-a-polyglot-task`, `tut:storefront/04`).
- A `comp.xref` (or a Vento filter) resolves `key → <a href>` at build, failing the build on an
  unknown key (no silent dead links).
- Generated reference units are addressable by key (`ref:plugin-sagas-core/presets`) so capability
  hubs link to reference without hardcoding paths.
- Benefit: pages move without breaking links; the build is the link checker.

---

## 7. Public-voice cleanup (remove all internal speech)

Every `docs/site/**` page is scrubbed of internal/agent/harness speech per the enumerated leakage
list in `ground/leakage-diagram-barraising.md`. Acceptance: **zero** occurrences of harness/OpenHands/
Codex/Claude/WSL/agent/supervisor/evaluator/run-id/PR-number/`.llm/`-path/internal-TODO/notes-to-self,
and zero raw un-rendered Vento/comp syntax in prose. Honest user-facing caveats (e.g. "alpha", "not yet
supported") are kept where accurate but rewritten in product voice.

---

## 8. Page-type catalog (authoring contract)
- **Type H — Hub** (capabilities/*): triplet template from §2.
- **Type B — Tutorial step** (tutorials/*/NN): goal → steps → checkpoint → prev/next.
- **Type R — Recipe** (how-to/*): problem → prerequisites → steps → verify.
- **Type E — Explanation** (explanation/*): concept essay, diagram-led, links out to do/learn.
- **Type F — Front-door** (/, /why, /quickstart, /concepts): conversion-oriented, card grids.

---

## 9. Migration map (deployed v3 → v3 IA)

| Deployed v3 page | Disposition |
|------------------|-------------|
| `capabilities/fresh-ui` | **Split**: keep `fresh-ui` (design system / copy-source); extract meta-framework into new `capabilities/fresh-framework` |
| `capabilities/background-jobs` (incl. inline Polyglot section) | **Enrich** + **extract** polyglot into `capabilities/polyglot-tasks`; add worker runtime modes |
| `capabilities/{services,database,durable-sagas,kv-queues-cron,streams,triggers,telemetry,auth}` | **Enrich** to hub triplet + assigned §4 gaps; add diagrams |
| `capabilities/index` | **Rebuild** as card grid with Learn/Do/Reference per card |
| `tutorials/*` (single 5-rung ladder) | **Replace** with 4 independent tracks (§3); retire the linear ladder |
| `how-to/*` (existing) | **Keep** + add the ★NEW recipes (§1) |
| `explanation/auth-model` | **Keep**; add the ★NEW explanation essays |
| front door (`/`, `/why`, `/quickstart`) | **Enrich** with cards/search/TOC; add `/concepts` |
| `reference/**` | **Untouched** (generated) |

---

## 10. Out of scope (explicit)
- Authoring/editing `reference/**` (generated).
- Re-injecting the stale docs-v2 audit accuracy caveats (they were fixed).
- Framework/code changes in `packages/**` or `plugins/**` (docs-only run).
- Repo-wide `deno fmt` of non-doc files; root deno.lock churn.
- The actual prose authoring (a later, separately-gated build run consumes this IA).
