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

## 0.5 Positioning & credibility (front-door content contract — from research §B)

The front-door zone (`/`, `/why`, `/concepts`) is not generic marketing; it is a **conversion contract**
aimed at one persona and built on provable claims. Grounded in `ground/competitor-doc-research.md` §B.

- **Lead value proposition — "Eliminate the Integration Tax."** The headline frame is that NetScript
  removes the glue-code/boilerplate normally paid to wire services + jobs + sagas + DB + telemetry
  together: one contract drives the API, the typed client, the docs, and the traces. `/` and `/why`
  lead with this, not a feature list.
- **Target persona — "the skeptical senior TS architect."** Authoring voice assumes a reader who has
  been burned by framework lock-in and magic. Every strong claim is paired with a runnable proof or an
  honest caveat. No hype adjectives without a code/diagram receipt.
- **Five credibility anchors (each MUST appear with a concrete proof, not a claim):**
  1. **Contract-to-client binding** — oRPC contract → generated typed SDK call, shown side-by-side (`comp.tabbedCode`).
  2. **Durable sagas + compensation** — a saga state-machine diagram + a runnable compensation example.
  3. **Trace propagation** — OTel `traceparent` carried across service→job→saga, shown end-to-end (the observability essay + a diagram).
  4. **Portability escape hatch** — `--no-aspire` / local-only path documented so the reader sees no hard cloud lock-in.
  5. **Own-your-UI** — copy-source Fresh UI components (no opaque dependency), shown via `comp.fileTree` of copied source.
- **Honest comparison matrix (`/why`, page-type F §8).** A `comp.apiTable` positioning NetScript against
  **NestJS · Encore · tRPC · Temporal · Hono**, with columns for *headline value*, *adoption concern*,
  and *where NetScript is weaker* — credibility through candor, per the persona. The matrix is the
  payload of `/why`, not a footnote.

These are content contracts for the build run; this planning PR does not author the prose.

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
│  ├─ deploy-local-aspire    ★NEW    local + Aspire topology, env/secrets/migrate/health (OD8)
│  └─ … (existing recipes kept)
│
├─ /explanation/                     UNDERSTANDING (concept essays)
│  ├─ architecture          ★NEW     plugins, packages, runtime, thread isolation
│  ├─ contracts-first                why contracts drive everything
│  ├─ durability-model      ★NEW     sagas/streams/jobs durability + compensation semantics
│  ├─ auth-model                     (existing, kept)
│  ├─ plugin-system         ★NEW     plugin↔package boundary (plain terms; NO archetype taxonomy — OD6)
│  └─ observability         ★NEW     OTel model end-to-end
│
├─ /reference/                       GENERATED (deno doc) — linked only, never authored
│
├─ /glossary
└─ /cli-reference                    CLI surface (add: db add). marketplace publish|search = alpha STUB (OD7)
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

| Track | App | Capability focus | Chapters (proposed) | Grounding |
|-------|-----|------------------|---------------------|-----------|
| **A — Storefront** | E-commerce checkout | Services, contracts, **durable sagas** (payment+inventory compensation), triggers (webhooks) | 01-scaffold · 02-catalog-service · 03-cart-contracts · 04-checkout-saga · 05-shipping-webhook · 06-deploy | playground-DIRECT |
| **B — Team Workspace** | Authenticated SaaS | **Auth** (multi-backend, session, route authz), services, **database** (per-plugin schema, second DB), provisioning jobs | 01-scaffold · 02-auth · 03-workspace-data · 04-provision-job · 05-route-authz · 06-deploy | **proof-gated** (no auth in playground; org/RBAC framing only if backends expose it — `tutorial-proof-plans.md` Track B) |
| **C — ERP Sync** | Back-office integration | **Background jobs**, queue providers, cron/triggers + **polyglot tasks** (python/shell) | 01-scaffold · 02-import-job · 03-polyglot-transform · 04-queue-and-cron · 05-deploy | TS spine DIRECT; **polyglot chapter proof-gated** (`tutorial-proof-plans.md` Track C) |
| **D — Live Dashboard** | Internal ops dashboard | **Fresh meta-framework** (builders/route/form/query/defer/interactive) + **SDK** (client/discovery/cache/collections/query-client) + **durable streams** (live data) | 01-scaffold · 02-contract-to-service · 03-sdk-cache-first-query · 04-definePage-QueryIsland · 05-live-stream (`useLiveQuery`) · 06-deploy | playground-DIRECT |

Each chapter is a **page-type B** (sequential tutorial step) with prev/next continuity, a result
checkpoint, and a "you built" summary. Every track ends in a `deploy` chapter that documents the
**local + Aspire** topology (env/secrets/migration/health per OD8) — **not** a cloud-production claim
(deferred to debt). Tracks B and C must clear their `tutorial-proof-plans.md` proof gates on
`origin/main` before any prose is authored; a gate that fails rescopes or cuts the track.

---

## 4. Feature homes for verified-but-undocumented surface (§4 of research)

The IA explicitly assigns every verified gap a home so nothing is left as orphan prose:

| Gap (verified on origin/main) | Home in v3 IA |
|-------------------------------|---------------|
| `@netscript/fresh` 11-subpath meta-framework (see `surface-inventory.md`) | `capabilities/fresh-framework` (hub) + Track D + explanation/architecture |
| `@netscript/sdk` discovery/cache/collections/query-client | `capabilities/sdk` (hub) + `how-to/discover-services` + Track D |
| Polyglot runtimes (cmd/powershell/dotnet/exe) + permissions model | `capabilities/polyglot-tasks` (hub) + `how-to/run-a-polyglot-task` + Track C |
| Worker runtime modes (in-process/web-worker/subprocess) | `capabilities/background-jobs` (enrich) + `how-to/tune-worker-runtime` |
| DB `mssql`/`mysql` adapters + `tracing` | `capabilities/database` (enrich) + `how-to/use-a-second-database` |
| Saga `presets`/`middleware`/`transports`/`agent`/`integration` | `capabilities/durable-sagas` (enrich, "extending sagas" section) |
| Service shutdown hooks / OpenAPI+Scalar / health primitives | `capabilities/services` (enrich) + `how-to/graceful-shutdown` + `how-to/expose-openapi-scalar` |
| Queue providers (KV/Redis/RabbitMQ/Postgres) | `capabilities/kv-queues-cron` (enrich) + `how-to/choose-a-queue-provider` |
| `runtime-config` package | `capabilities/runtime-config` (hub) + `explanation/architecture` |
| CLI: `db add` | `cli-reference` (enrich) |
| CLI: `marketplace publish\|search` (**alpha stub**, OD7) | `cli-reference` with status badge + captured current behavior; excluded from "full CLI surface" claim |

---

## 5. Design system & rendered diagrams (D3 — full scope)

Centrally-owned surfaces (`base.vto`, `styles/`, `_components/*.vto`, `_data.ts`) are **in scope**.
All additions must be additive and backward-compatible with existing pages.

### 5.1 New shared components
Priority tiers from research §C: **P0** = parity-critical (every competitor has it), **P1** = differentiator,
**P2** = polish. Each maps to a competitor pattern it adopts.

| Component | Pri | Purpose | Adopted from | Owner surface |
|-----------|-----|---------|--------------|---------------|
| In-site search | P0 | Pagefind index + search box in `base.vto` header | Lume (native Pagefind) | `base.vto`, build pipeline |
| On-page TOC | P0 | right-rail auto-TOC (IntersectionObserver highlight), enables single-page deep-dives | Laravel (deep on-page TOC) | `base.vto`, `styles/` |
| Code-copy button | P0 | per code-block clipboard button | all (table-stakes) | `_components/` + `styles/` |
| `comp.tabbedCode` | P1 | side-by-side / tabbed code panes (contract↔client, automated↔manual) | TanStack (interactive code tabs) | new `_components/tabbedCode.vto` |
| `comp.tabbedRuntime` | P1 | runtime/DB selector (Deno↔Node, postgres↔mssql↔mysql) **synced via localStorage** across the whole site | TanStack (adapter tabs that rewrite context) | `_components/` + small client JS |
| `comp.diagram` | P1 | renders Mermaid (see §5.2) with a static SVG fallback; supports ERD/state-machine | Medusa (module schema viz) | new `_components/diagram.vto` |
| `comp.fileTree` | P1 | project file-tree rendering (scaffold/tutorials/copy-source proof) | Astro (file-tree visualizer) | new `_components/fileTree.vto` |
| `comp.badge` | P1 | status/feature badges (Stable/Alpha/Deno-native/oRPC/Prisma-backed/OTel-wired) | Astro (visual API badges) | new `_components/badge.vto` |
| `comp.learningPath` | P1 | tutorial step-progress indicator + persona path-split | Astro (Diátaxis progress) | `_components/` + `_data.ts` track ordering |
| `comp.cardsGrid` | P1 | capability/track card grids (front door, hub indexes) | Medusa/Astro (card grids) | new `_components/cardsGrid.vto` |
| prev/next nav | P1 | sequential nav for tutorial chapters (`comp.nextPrev`) | all | `base.vto` + `_data.ts` track ordering |
| Line-highlight in code | P1 | highlight added/changed lines in adoption snippets (§8.1 diffing) | Astro (line-level diffing) | code-render pipeline + `styles/` |
| "Was this helpful" | P2 | lightweight feedback widget (optional) | Medusa (feedback widget) | `_components/` |
| Version pill / switcher | P2 | static "alpha" pill now; context-preserving switcher deferred to beta (OD5 debt) | Medusa/Laravel (version UX) | `base.vto` |

Code-render-pipeline behaviors (file-path first-line comment §8.1, line-highlighting) are build-time
Markdown/Vento transforms, not per-page components, but are gated by the structure audit (plan.md §5).

### 5.2 Diagram system
- **Tooling (LOCKED, OD1):** Mermaid rendered **at build time to a committed static SVG**, wrapped by
  `comp.diagram` as `<figure>` + `<figcaption>` alt text. **No client-side Mermaid JS** — diagrams are
  visible with JavaScript off and are diffable assets. ASCII diagrams in current pages are replaced where
  they map to a §5.3 entry.
- Avoid the Vento `function`-keyword landmine in any code sample passed to comp tags
  ([[lume-vento-function-keyword-landmine]]): use arrow/const forms.

### 5.3 Diagram inventory (from grounding `ground/leakage-diagram-barraising.md`)
Minimum set the build run must produce (target page in parens): overall architecture
(explanation/architecture) · request lifecycle contract→handler→client→island (capabilities/services)
· saga state machine + compensation (durable-sagas) · plugin thread-isolation model
(explanation/architecture) · queue→worker→scheduler flow (kv-queues-cron) · polyglot task execution
(polyglot-tasks) · Aspire resource graph (quickstart/deploy) · auth flow backends+middleware (auth) ·
streams producer→server→consumer (streams) · DB per-plugin schema aggregation (database) · scaffold
project file-tree (quickstart + tutorial 01s, via `comp.fileTree`) · **OTel `traceparent` propagation
across service→job→saga** (explanation/observability — credibility anchor #3, §0.5).

**Per-engine schema/ERD diagrams (Medusa "module starts with its schema" — page-type H step 2).** Every
stateful-engine hub opens with an ERD or state-machine of its persisted data model, rendered by
`comp.diagram`: sagas (saga + step + compensation tables) · streams (stream/offset/consumer) · jobs
(job/attempt/schedule) · cron (schedule/run) · database (per-plugin schema aggregation, also listed
above). These are drawn from the live Prisma schemas so they stay accurate.

---

## 6. Cross-reference system (W6 — auto-resolving xref)

Replaces hand-maintained internal links. Design (LOCKED, OD2/OD3):
- A **dedicated `_data/xref.ts`** (not `_data.ts`, which stays nav-only) maps stable **keys** →
  canonical URLs. Locked key namespaces: `cap:` `howto:` `tut:` `explain:` `concept:` `ref:` `cli:`
  `glossary:` (e.g. `cap:durable-sagas`, `howto:run-a-polyglot-task`, `tut:storefront/04`).
- A **`comp.xref` Vento filter** resolves `key → <a href>` at build, **failing the build on an unknown
  key** (no silent dead links).
- Generated reference units are addressable by key `ref:<unit>/<subpath>` (matches `surface-inventory.md`,
  e.g. `ref:plugin-sagas-core/presets`) so capability hubs link to reference without hardcoding paths.
- Benefit: pages move without breaking links; the build is the link checker.

---

## 7. Public-voice cleanup (remove all internal speech)

Every `docs/site/**` page is scrubbed of internal/agent/harness speech per the enumerated leakage
list in `ground/leakage-diagram-barraising.md`. Acceptance: **zero** occurrences of harness/OpenHands/
Codex/Claude/WSL/agent/supervisor/evaluator/run-id/PR-number/`.llm/`-path/internal-TODO/notes-to-self,
and zero raw un-rendered Vento/comp syntax in prose. Honest user-facing caveats (e.g. "alpha", "not yet
supported") are kept where accurate but rewritten in product voice.

---

## 8. Page-type catalog (authoring contract — strict section order)

Grounded in the competitor teardown (`research.md` §10 / `ground/competitor-doc-research.md`: Medusa,
TanStack, Laravel, Astro, Lume). Each page type has a **locked section order** so every contributor
(and every authoring agent) produces structurally identical pages. The build run's structure audit
(plan.md §5) asserts each page contains its type's required sections **in order**.

### Type F — Front-door (`/`, `/why`, `/quickstart`, `/concepts`)
*Audience: skimmers, skeptical senior TS architects, decision-makers. Tone: warm, direct, zero fluff.*
1. **Direct value title + subhead** — the exact problem solved, in ≤2 lines (the "Integration Tax" anchor, §0.5).
2. **Interactive code proof** — `comp.tabbedCode` side-by-side **contract ↔ client call** (the "schema is the docs" proof).
3. **Capability card grid** — `comp.cardsGrid` over the foundational pillars, each card a Learn/Do/Reference triplet link.
4. **Persona / path split** — onboarding routes per persona (build-first vs evaluate-first), via `comp.learningPath`.
5. **Honest comparison matrix** — `comp.apiTable` vs NestJS/Encore/tRPC/Temporal/Hono incl. NetScript's weaknesses (§0.5).
6. **Next steps** — `comp.nextPrev` / cards into quickstart + a tutorial track.
   - `/quickstart` specializes steps 2–4 into a single 0→running flow with a `comp.fileTree` of the scaffold output.

### Type H — Hub (`capabilities/*`)
*Medusa "module landing" + TanStack "API reference" hybrid. The §2 triplet, expanded to locked order:*
1. **H1 + one-sentence definition + status `comp.badge`(s)** (Stable/Alpha/Deno-native/oRPC/Prisma-backed/OTel-wired).
2. **Architecture/schema diagram** — `comp.diagram`; for stateful engines (sagas/streams/jobs/cron/database) this is an
   **ERD / state-machine** of the engine's data model (Medusa "every module starts with its schema").
3. **What it is** — 3–5 sentences; links to `/explanation/*` for depth.
4. **Learn → / Do →** — links into the tutorial track(s) and how-to recipes that exercise it.
5. **Minimal example** — smallest correct runnable snippet; file-path first-line comment + copy button (§8.1).
6. **Key types first** — `comp.apiTable` of the **primary interface(s)** (`SagaContext`, `ServiceContext`, …) showing
   exact fields, types, required flags, defaults **before** prose usage (TanStack "signature-first" pattern).
7. **Options / API table** — secondary option tables; each enumerates ACTUAL keys (confirmed via `deno doc`).
8. **Production notes** — per-capability deploy/footgun callouts (`comp.callout`): ports, locks, timeouts, drain, retries
   (Laravel "deployment gotchas per feature").
9. **Reference →** — `comp.xref` `ref:<unit>/<subpath>` link(s) into generated `/reference/<unit>`.

### Type B — Tutorial step (`tutorials/*/NN`)
*Astro "Diátaxis tutorial step" pattern. Encouraging, sequential.*
1. **Progress indicator + breadcrumb** — `comp.learningPath` step N of M.
2. **Objective** — "In this step you will …" (1 paragraph, concrete outcome).
3. **Prerequisites / state check** — a command that verifies the reader's project is in the expected state.
4. **File-path-named code blocks** — every block starts with its exact target path; added lines highlighted (§8.1).
5. **Verify your progress** — a runnable check + expected output (Astro "verify" step), then an interactive checklist.
6. **What you built + Next** — 1-line recap + `comp.nextPrev` to the next chapter.

### Type R — Recipe (`how-to/*`)
*Medusa/Astro recipe pattern. Direct, concise, practical.*
1. **Scope statement** — one sentence: what this recipe cooks.
2. **Prerequisites table** — inputs/plugins/setup required (`comp.apiTable` or list).
3. **Steps** — numbered; code templates with highlighted added lines + file-path comments.
4. **(Optional) automated vs manual** — `comp.tabbedCode` CLI-automated path vs manual path (Astro `astro add` pattern).
5. **In-production pitfalls** — `comp.callout` footguns (ports, locks, timeouts, permissions).
6. **See also** — `comp.xref` cards to related hubs/recipes.

### Type E — Explanation (`explanation/*`)
*Laravel/Temporal conceptual pattern. Discursive, architectural, analytical.*
1. **Mental model / analogy** — broad framing of the topic.
2. **Architecture diagram** — `comp.diagram` layer/sequence map (crash-survivability flow for durability essays).
3. **State-transition / invariants table** — inputs→outputs / guarantees.
4. **Design trade-offs** — why this design, what alternatives were rejected (the "Skeptical Architect" payload).
5. **Where to go** — links to the capability hub(s) and tutorial(s) that apply it.

### 8.1 Code-sample conventions (apply to every type — Medusa + Astro)
- **File-path first line:** every multi-line code block opens with `// <path/from/project/root>.ts` so readers always
  know where code lives (Medusa convention). Single-line terminal snippets are exempt.
- **Line-level highlighting / diffing:** when a snippet *adds* code to adopt a feature, highlight the added lines
  (Astro line-diff). Removed lines marked where relevant.
- **Types before usage:** in hubs/reference contexts, show the type signature (fields/defaults) before the call-site example.
- **Runnable & accurate:** every API used is confirmed via `deno doc` at author time (binds `hub-content-contracts.md`).
- **Vento safety:** never the `function` keyword inside a comp-tag arg ([[lume-vento-function-keyword-landmine]]).

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

---

## 11. Competitor-pattern adoption matrix (traceability to `ground/competitor-doc-research.md`)

Every "what to steal" finding from the competitor teardown is assigned a concrete home in this IA, so
the inspiration is auditable rather than implicit. Source: research §A (teardown) + §C (synthesis).

| Source | Pattern stolen | Where it lands in v3 IA |
|--------|----------------|--------------------------|
| **Medusa** | Module page **starts with its schema/ERD** | Page-type H step 2 (§8) + per-engine ERDs (§5.3) |
| **Medusa** | **File-path comment** as first line of every code block | Code conventions §8.1 (all page types) |
| **Medusa** | Componentized **multi-module workflow recipes** | How-to recipes (Type R §8) + Track A/D cross-capability chapters |
| **Medusa** | Inline **feedback widget** | "Was this helpful" component (§5.1, P2) |
| **Medusa/Laravel** | **Context-preserving version UX** | Version pill now, switcher deferred to beta (§5.1 P2 / OD5 debt) |
| **TanStack** | **TypeScript signature-first** (types/defaults before usage) | Page-type H step 6 + code convention "types before usage" (§8.1) |
| **TanStack** | **Interactive code tabs** (runtime/adapter swap) | `comp.tabbedCode` + `comp.tabbedRuntime` synced (§5.1) |
| **Laravel** | **Sequential IA folder progression** | Diátaxis spine + ordered tutorial tracks (§1, §3) |
| **Laravel** | **Single-page deep dives** w/ deep on-page TOC | On-page TOC component (§5.1 P0) + consolidated capability hubs (§2) |
| **Laravel** | **Per-feature production gotchas** + security-by-default | Page-type H step 8 "Production notes" + Type R step 5 (§8) |
| **Astro** | **File-tree visualizer** | `comp.fileTree` (§5.1) + scaffold/copy-source diagrams (§5.3) |
| **Astro** | **Visual API badges** | `comp.badge` (§5.1) + hub H1 status badges (§8 Type H step 1) |
| **Astro** | **Line-level code diffing** (highlight added lines) | Line-highlight pipeline (§5.1) + code convention §8.1 |
| **Astro** | **"Verify your progress"** step + interactive checklist | Page-type B step 5 (§8) |
| **Lume** | **Native Pagefind** search | In-site search (§5.1 P0); index scope incl. `reference/**` (OD, §6/plan §2a) |
| **Lume** | **Deno-optimized Markdown/Vento** rendering | Build pipeline; Vento `function`-keyword landmine guard (§5.2, §8.1) |
| **Research §B** | **"Integration Tax" lead + Skeptical-Senior-Architect persona** | Front-door content contract §0.5 |
| **Research §B** | **5 credibility anchors** (each proof-backed) | §0.5 + diagram inventory anchor #3 (§5.3) |
| **Research §B** | **Honest comparison matrix** vs NestJS/Encore/tRPC/Temporal/Hono | `/why` page-type F step 5 (§8) + §0.5 |

This planning PR locks these as **content/structure contracts**; the separately-gated build run realizes
them. The structure audit (plan.md §5) asserts the page-type section orders (§8) are present in order.
