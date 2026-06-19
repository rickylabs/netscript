# NetScript Documentation Website — SOTA Build Plan v2

**Run:** `docs-content-architecture--impl` · **Branch:** `docs/content-architecture` · **PR:** #59
**Scope (user-approved 2026-06-18, reaffirmed):** the **WHOLE site arborescence**, grounded in the
real scaffold, evaluated un-narrowed across the entire tree. NOT just the front page.
**Inputs synthesized:** `research/competitor-doc-research.md` (dossier), `ground-truth.md`,
`ground-truth-project-anatomy.md`, the live scaffold, and the shipped front-door pages.
**Supersedes:** `build-plan.md` (Wave A–F) — this v2 keeps its connective-tissue mechanics and
authoring contract, and upgrades IA depth, page-type rigor, per-page accuracy markers, and the
component gap list to the competitor bar.

---

## 0. Quality Bar & Success Criteria (what PLAN-EVAL and final-eval judge against)

The deliverable is a **state-of-the-art, exhaustive, content-rich** developer documentation site at
the level of Medusa / TanStack / Laravel / Astro — explicitly **not minimalistic**. Concretely:

1. **Whole-tree completeness.** Every zone in the locked IA (§2) has its index + all child pages
   authored. No stubs, no "TODO", no placeholder prose. The only as-is lane is
   `docs/site/reference/**` (generated `deno doc`, 22 units) which is **KEPT UNTOUCHED**.
2. **Fil d'Ariane (the learning thread).** A reader can travel Home → Quickstart → Tutorials ladder
   → How-to → Explanation → Capabilities → Reference without a dead end: every body page has a
   correct breadcrumb (it is a `navSections` item); **ladder and zone-sequence pages additionally
   carry a `prev`/`next` chain** (operational scope per §7 — not every leaf page); tutorials form one
   continuous narrative building a single app.
3. **Reality-grounded.** Every command, flag, port, endpoint, import specifier, file path, and code
   shape is copied from the ground-truth artifacts — never invented. Each page brief carries
   **accuracy markers** (§4) the author must satisfy and the evaluator must verify against
   ground-truth.
4. **Depth signals** matching the reference sites: file-path-annotated code blocks, honest comparison
   matrices, "production pitfalls" callouts, real endpoint/port citations, cross-links to
   `reference/<unit>/`, and per-capability "Learn / Do / Reference" triplets.
5. **Build-clean.** `deno task --cwd docs/site build` exits 0; no Vento `function`-keyword landmine
   (§5); pages mixing comps + markdown declare `templateEngine: [vento, md]`.
6. **Honesty about alpha reality.** Where the scaffold ships stubs (streams producer/consumer,
   worker trace/progress no-ops), docs say so plainly rather than promising runtime that doesn't
   exist yet (per ground-truth notes).

**Out of scope (hard):** `docs/site/reference/**`, `_includes/layouts/base.vto`, `styles/`,
`_components/*.vto` source edits, the catalog, version pins, `packages/`, `plugins/`. New components
are **recommendations** (§6), not edits in this run.

---

## 1. Audience & Positioning (from dossier Section B — drives tone)

Lead anchor: **"Eliminate the integration tax."** Primary persona: the **skeptical senior TS
architect** who wants Deno-native defaults, explicit contracts-first structure (oRPC), and local
orchestration parity (Aspire) with a portable `--no-aspire` escape hatch. Tone: warm, direct,
technically precise, code-first, honest about weaknesses. Every zone inherits this voice (match the
shipped `why.vto` / `quickstart.vto`).

---

## 2. Locked Information Architecture (multi-level Diátaxis + capabilities hub + ladder)

Reconciles the dossier's recommended IA with the real component/nav mechanics. Zones are listed in
`navSections` order; each zone **index is listed before its children** so the breadcrumb
deepest-prefix match resolves correctly.

```
Start here
  /                      Home — hero, 6-pillar featureGrid, oRPC contract↔client proof, persona split
  /quickstart/           5-min: install → init → aspire run → db → hit an endpoint        [SHIPPED]
  /why/                  Integration tax; honest matrices vs NestJS/Encore/tRPC/Temporal/Hono [SHIPPED]

Learn — Tutorials (Diátaxis: learning-oriented; ONE continuous app, "users + onboarding")
  /tutorials/                       index — the ladder map (learningPath)
  /tutorials/first-workspace/       init, tour every generated dir, aspire run, dashboard :18888
  /tutorials/build-a-service/       contract → users service (:3001) → typed client → island
  /tutorials/background-jobs/       plugin add worker; author a job; trigger via :8091
  /tutorials/durable-workflow/      plugin add saga; consume UserSettingsCreated; sagas :8092
  /tutorials/ingest-webhook/        plugin add trigger; POST :8093 inbound/generic → job; closes ladder

How-to (Diátaxis: task-oriented recipes)
  /how-to/                          index — recipe directory (cardsGrid of recipes)
  /how-to/add-a-plugin/             [EXISTS — relink/refresh]
  /how-to/add-a-service/           
  /how-to/database-migration/       db init / generate / seed / status (Aspire-up dependency)
  /how-to/queue-kv-cron/            KV, queue, cron usage
  /how-to/add-opentelemetry/        spans, structured logs, traceparent propagation
  /how-to/customize-fresh-ui/       ui:init / ui:add, copy-source ownership
  /how-to/deploy/                   portability, Docker, bare-metal --no-aspire
  /how-to/author-a-plugin/          building a custom plugin (advanced)

Core concepts — Explanation (Diátaxis: understanding-oriented)
  /explanation/                     index — glossary-linked mental-model map
  /explanation/architecture/        [EXISTS — soften doctrine terms, relink]
  /explanation/contracts/           oRPC contract → client → query → island type flow
  /explanation/plugin-model/        [EXISTS — relink] thread-isolated background processors
  /explanation/durable-workflows/   saga state machines, correlation, compensation-as-effects
  /explanation/observability/       OTel spans, structured logs, health endpoints, Aspire traces
  /explanation/aspire/              AppHost (aspire/apphost.mts), resource graph, dashboard

Capabilities (Medusa-style module hubs — concept + headline API + Learn/Do/Reference triplet)
  /capabilities/                    index — capability matrix grid
  /capabilities/services/           defineService, oRPC, ports
  /capabilities/background-jobs/    workers — defineJobHandler, :8091
  /capabilities/durable-sagas/      sagas — defineSaga builder, :8092
  /capabilities/triggers/           triggers — defineWebhook (Hono), :8093
  /capabilities/streams/            streams — defineStreamTopic (stubbed runtime, :4437)
  /capabilities/database/           Prisma + Postgres, per-plugin schema aggregation
  /capabilities/kv-queues-cron/     Deno KV / queue / cron primitives
  /capabilities/telemetry/          OTel built into handlers
  /capabilities/fresh-ui/           Fresh dashboard, copy-source

Reference (KEEP — generated deno doc, UNCHANGED)
  /reference/                       index (22 units: aspire, cli, config, contracts, cron, database,
                                    fresh, fresh-ui, kv, logger, plugin, prisma-adapter-mysql, queue,
                                    runtime-config, sagas, sdk, service, streams, telemetry, triggers,
                                    watchers, workers)

Resources
  /glossary/                        saga, trigger, stream, contract, contribution, archetype, AppHost…
  /cli-reference/                   curated companion to reference/cli/, grouped by workflow
```

**The continuous-app thread (the real fil d'Ariane).** The tutorials build ONE app and reuse the
real cross-plugin wiring proven in the anatomy:
- `build-a-service` ships the `users` oRPC service + contract (seeded in-memory records — the FE↔contract proof).
- `background-jobs` adds the `create-user-settings` job which **publishes the `UserSettingsCreated` saga message** (anatomy §1).
- `durable-workflow` adds a saga that **handles `UserSettingsCreated`** and emits `sagaComplete(...)` (anatomy §2).
- `ingest-webhook` adds the `generic-inbound-webhook` which **enqueues a workers job** via `enqueueJob` (anatomy §3).
This choreography is real and compiles; the ladder narrates it end to end.

---

## 3. Page-Type Catalog (dossier catalog mapped to the 9 real Vento components)

Every page must conform to one type. "Components" lists ONLY shipped components; bracketed
[recommended:] notes a §6 gap a page would benefit from but must not block on.

| Type | Used by | Required section order | Components |
|---|---|---|---|
| **T1 Front-door hub** | `/`, `/why/` | Value title → contract↔client `tabbedCode` proof → 6-pillar `featureGrid` → persona split (`card` grid) → honest comparison matrix (`apiTable`) → next-steps `learningPath` | hero, featureGrid, tabbedCode, apiTable, card, learningPath |
| **T2 Quickstart** | `/quickstart/` | Goal → prereqs `callout` → numbered commands (install→init→aspire run→db→endpoint) → "you should see" → next | tabbedCode, callout, nextPrev |
| **T3 Tutorial rung** | `/tutorials/<rung>/` | Objective ("In this step you will…") → prereq state-check → numbered steps with **file-path-annotated** code blocks → "verify" (real command + expected output/endpoint) → recap → prev/next | tabbedCode, callout, learningPath, nextPrev |
| **T4 How-to recipe** | `/how-to/<recipe>/` | Scope sentence → prerequisites table (`apiTable`) → steps (added-lines code) → production-pitfalls `callout` → "see also" `card` grid → prev/next | apiTable, tabbedCode, callout, card, nextPrev |
| **T5 Explanation** | `/explanation/<topic>/` | Mental model/analogy → ASCII architecture diagram (fenced) → state/flow table (`apiTable`) → design trade-offs → links to capability+reference → prev/next | apiTable, callout, nextPrev [recommended: ASCII box canvas] |
| **T6 Capability hub** | `/capabilities/<cap>/` | 1-screen concept → headline API `tabbedCode` (from anatomy) → endpoint/port `apiTable` → **Learn / Do / Reference** `card` triplet → prev/next | tabbedCode, apiTable, card, callout, nextPrev [recommended: badge, fileTree] |
| **T7 Zone index** | each `/<zone>/` index | Zone intro → `learningPath` or `card` grid of children with one-line summaries → cross-zone links | learningPath, card, callout |
| **T8 Resource** | `/glossary/`, `/cli-reference/` | Intro → grouped definition/command tables (`apiTable`) → cross-links | apiTable, callout |

---

## 4. Per-Page Grounded Briefs with Accuracy Markers

Format: **path** [status] — brief. **AM:** accuracy markers the author must satisfy verbatim from
ground-truth and the evaluator must verify. Status: SHIPPED / EXISTS (refresh) / NEW.

### Start here
- **`index.vto`** [SHIPPED — light refresh] T1. Ensure 6-pillar grid + contract↔client proof links into capabilities. **AM:** install line `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`; use `netscript <cmd>` form only.
- **`quickstart.vto`** [SHIPPED] T2. **AM:** order = install → `netscript init my-app --db postgres --service --service-name users --service-port 3001 --yes` → `cd aspire && aspire restore && aspire run` (dashboard :18888) → `netscript db init --name init` → `netscript db generate` → `netscript db seed` → hit users `:3001`. Aspire is **step 2, before any db command** (hard rule 1–2).
- **`why.vto`** [SHIPPED] T1. **AM:** matrices vs NestJS/Encore/tRPC/Temporal/Hono honest about weaknesses; integration-tax framing.

### Learn — Tutorials (T3 rungs; one continuous app)
- **`tutorials/index.md`** [EXISTS — re-skin] T7. learningPath of the 5 rungs. **AM:** links resolve to the 5 child urls below.
- **`tutorials/first-workspace.md`** [EXISTS — rewrite/expand] T3. init → tour each generated dir → `aspire run` → dashboard. **AM:** real tree (apps/dashboard, contracts, services/users, plugins/, aspire/apphost.mts, database/postgres, appsettings.json, deno.json, netscript.config.ts); dashboard `http://localhost:18888`; Aspire resources postgres, garnet, *-api, *. prev: Quickstart → next: Build a service.
- **`tutorials/build-a-service.md`** [NEW] T3. contract → users service → typed client → island. **AM:** contract pattern `oc.route({method}).input(zod).output(zod)` then `implement(Contract)` → `.handler()`; `defineService(router, { name:'users', version:'1.0.0', port: parseInt(Deno.env.get('PORT')||'3001'), openapi:{...} })`; handlers return **seeded in-memory records** (no DB yet — say so); import via `@<project>/contracts` alias; users routes `/api/v1/users/*`, `/api/rpc/v1/...`, port **3001**. next: Add background jobs.
- **`tutorials/background-jobs.md`** [NEW] T3. `netscript plugin add worker --samples`; author a job; trigger. **AM:** `defineJobHandler(async (ctx) => …)` + `createJobTools(ctx)` (`{log,progress,trace}` — **no-op stubs in scaffold, don't promise real spans**) + `createSuccessResult`/`createFailureResult`; id via `Object.assign(handler, { id })`; import `@netscript/plugin-workers-core`; real sample `create-user-settings.ts` **publishes `UserSettingsCreated`**; endpoints `:8091` `/api/v1/workers/{jobs,executions,tasks,seed}`, trigger `POST /api/v1/workers/jobs/{id}/trigger`. next: A durable workflow.
- **`tutorials/durable-workflow.md`** [NEW] T3. `plugin add saga`; saga consumes the worker's message. **AM:** fluent builder `defineSaga(id).durability('t1').state<S>({…}).on<Type,Payload>(type, (saga,msg,ctx) => [ sagaComplete({…}) ]).build()`; import `@netscript/plugin-sagas-core`; **compensation is modeled as message-handler effect arrays, not `.step()/.compensate()`**; registry lists via KV; endpoints `:8092` `/api/v1/sagas/{sagas,instances,publish}`, `/health/live`. Narrative: handle `UserSettingsCreated` emitted by the job. next: Ingest a webhook.
- **`tutorials/ingest-webhook.md`** [NEW] T3. `plugin add trigger`; webhook → job. **AM:** `defineWebhook(() => Promise.resolve([ enqueueJob(jobRef, { payload, priority }) ]), { id, path:'inbound/generic', verifier:'memory', tags })` from `@netscript/plugin-triggers-core/builders`; **triggers service is Hono, not oRPC**; `POST :8093/api/v1/webhooks/inbound/generic` resolves trigger id `inbound/generic`; `GET /api/v1/events`. Closes the ladder (prev: durable-workflow; next: How-to index).
- **DELETE `tutorials/getting-started.md`** — stale; content split into quickstart (shipped) + first-workspace. Record removal in commits.

### Core concepts — Explanation (T5)
- **`explanation/index.md`** [EXISTS — re-skin] T7.
- **`explanation/architecture.md`** [EXISTS — keep prose, soften ≤2 doctrine terms, add nav/relink] T5.
- **`explanation/contracts.md`** [NEW] T5. oRPC contract → `implement` → `.handler()` → typed client → tanstack-query → island. **AM:** `@orpc/{contract,server,client,zod,tanstack-query}` ^1.14.6; zod ^4.x; link `reference/contracts/`, `reference/service/`.
- **`explanation/plugin-model.md`** [EXISTS — relink] T5. **AM:** plugins canonical at `plugins/<name>/mod.ts`; background processors run from `bin/combined.ts` (workers, sagas) and `src/runtime/trigger-processor.ts`; `netscript.config.ts` references `./plugins/*/mod.ts`.
- **`explanation/durable-workflows.md`** [NEW] T5. **AM:** durability `'t1'`; state + message handlers; `sagaComplete` effects; correlation/instances; honest that sample models compensation as effects.
- **`explanation/observability.md`** [NEW] T5. **AM:** OTel `@opentelemetry/api` ^1.9 wired into handlers; `createJobTools` trace stubs are no-ops in scaffold; health endpoints per plugin; Aspire OTLP `http://localhost:4318`, dashboard :18888.
- **`explanation/aspire.md`** [NEW] T5. **AM:** `aspire/apphost.mts` is the **generated Node/TS** AppHost (NOT dotnet); `aspire.config.json` `appHost.path="apphost.mts"`, language `typescript/nodejs`, SDK 13.4.4, `Aspire.Hosting.PostgreSQL`; registration order from `.helpers/index.mts`; flag the `netscript.config.ts` `aspire.appHost:'dotnet/AppHost'` divergence honestly.

### Capabilities (T6 hubs; NONE exist — all NEW)
- **`capabilities/index.md`** [NEW] T7. capability matrix grid linking all 9.
- **`capabilities/services/`** [NEW] **AM:** `defineService` one-call vs plugin `createService().with*().serve()` fluent builder (two construction APIs — call it out); users :3001; ref `reference/service/`.
- **`capabilities/background-jobs/`** [NEW] **AM:** workers :8091; `defineJobHandler`; ref `reference/workers/`.
- **`capabilities/durable-sagas/`** [NEW] **AM:** sagas :8092; `defineSaga` builder; ref `reference/sagas/`.
- **`capabilities/triggers/`** [NEW] **AM:** triggers :8093 **Hono**; `defineWebhook`; ref `reference/triggers/`.
- **`capabilities/streams/`** [NEW] **AM:** `defineStreamTopic/Producer/Consumer` from `@netscript/plugin-streams`; **producer/consumer are stubs, runtime deferred** — frame as topic-schema + durable-streams dev service :4437; ref `reference/streams/`.
- **`capabilities/database/`** [NEW] **AM:** Prisma 7.8 `runtime="deno"`, prisma-zod-generator; per-plugin `.prisma` aggregated under `database/postgres/schema/plugins/<plugin>/`; config carried by `appsettings.json` not the empty `databases` block; ref `reference/database/`, `reference/prisma-adapter-*`.
- **`capabilities/kv-queues-cron/`** [NEW] **AM:** Deno KV `unstable:["kv"]`; ref `reference/kv/`, `reference/queue/`, `reference/cron/`.
- **`capabilities/telemetry/`** [NEW] **AM:** ref `reference/telemetry/`, `reference/logger/`.
- **`capabilities/fresh-ui/`** [NEW] **AM:** `apps/dashboard` Fresh + Preact + Tailwind v4 + Vite; copy-source ownership; ref `reference/fresh/`, `reference/fresh-ui/`.

### How-to (T4)
- **`how-to/index.md`** [EXISTS — re-skin] T7 cardsGrid.
- **`how-to/add-a-plugin.md`** [EXISTS — refresh] **AM:** `netscript plugin add <worker|saga|trigger|stream> --samples`; lands under `plugins/<name>/`.
- **`how-to/add-a-service.md`** [NEW] **AM:** `--service-name`, port flag; `defineService`.
- **`how-to/database-migration.md`** [NEW] **AM:** `netscript db init --name init` → `db generate` → `db seed` → `db status`; **requires `aspire run` first** (hard rule 2); migrations path from `prisma.config.ts`.
- **`how-to/queue-kv-cron.md`** [NEW] **AM:** KV/queue/cron from reference; `--unstable-kv`.
- **`how-to/add-opentelemetry.md`** [NEW] **AM:** spans via `trace.withChildSpan`; traceparent propagation; OTLP :4318.
- **`how-to/customize-fresh-ui.md`** [NEW] **AM:** `ui:init`/`ui:add` tasks; copy-source.
- **`how-to/deploy.md`** [NEW] **AM:** `--no-aspire` portability escape hatch; Docker/bare-metal; raw `deno task` targets.
- **`how-to/author-a-plugin.md`** [NEW] **AM:** `scaffold.plugin.json` provider.kind, manifest exports, `mod.ts` contract.

### Resources
- **`glossary.md`** [NEW] T8. Terms: saga, trigger, stream, contract, contribution, archetype, plugin, AppHost, durability tier, capability, oRPC, compensation-as-effect.
- **`cli-reference.md`** [NEW] T8. Grouped by workflow (scaffold / aspire / db / plugin / ui / dev); companion to `reference/cli/`.

---

## 5. Connective-Tissue Mechanics (confirmed from source — carried from build-plan)

- **Breadcrumb** auto-rendered by `base.vto` `{{ comp.breadcrumb() }}` from `navSections` + page url.
  A page gets a correct trail **iff it is a `navSections` item** → Wave A expands `_data.ts`.
- **nextPrev** auto-rendered `{{ comp.nextPrev({ prev, next }) }}` from front-matter
  `prev:{label,href}` / `next:{label,href}` → each body page sets these.
- **learningPath** `{{ comp.learningPath({ steps:[{label,href}] }) }}` on zone indexes + ladder.
- **callout** body form uses the **tag-form opener** `{{ comp callout { type, title } }}…inline HTML…{{ /comp }}`
  (type note|tip|important|warning). The function-call opener `{{ comp.callout({...}) }}…{{ /comp }}` is
  **BUILD-BREAKING** and must never be used — the shipped, building front-door pages (`index.vto`,
  `why.vto`, `quickstart.vto`) all use the tag form. **markdown-it does NOT process markdown inside
  emitted HTML** → callout bodies are inline HTML.
- **hero/featureGrid/apiTable/tabbedCode/card** take all content through args (no body slot) and use the
  function-call form `{{ comp.NAME({...}) }}` (confirmed in shipped `quickstart.vto`).
- **LANDMINE:** the literal keyword `function` inside ANY comp-tag arg aborts the build. Use
  arrow/`const` in code samples (memory `lume-vento-function-keyword-landmine`).
- Pages mixing comps + markdown need front matter `templateEngine: [vento, md]`.
- `navSections` ordering: list each zone index BEFORE its children so child pages win the final crumb.

---

## 6. Prioritized Component / Design-System Gap List (RECOMMENDATIONS — not edits this run)

`base.vto`, `styles/`, and `_components/*.vto` are centrally owned. These are recommendations for a
follow-up, component-owning run; authoring uses only the 9 shipped components.

**P0 — wayfinding/usability:** On-page scrolling TOC (IntersectionObserver), Pagefind in-header
search, one-click code-copy hook (wrap `<pre>`).
**P1 — capability clarity:** `comp.fileTree` (scaffold trees), `comp.tabbedRuntime` (localStorage-synced
runtime/db tabs), `comp.badge` (`oRPC`, `Deno-Native`, `Prisma-Backed`, `OTel Wired`).
**P2 — polish:** ASCII box layout canvas (no-shift monospace diagrams), `comp.cardsGrid`/`comp.grid`
(recipe directories), `comp.version` switcher.

Each authored page is written so that adding a P0/P1 component later is additive (e.g. headings are
clean `h2/h3` so a TOC plugin works without rewrites).

---

## 7. Authoring-Agent Contract (every page brief inherits this)

1. Ground every command/endpoint/path/code shape in `ground-truth.md` + `ground-truth-project-anatomy.md`. Never invent.
2. Dev install: `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`; commands as `netscript <cmd>`.
3. For framework API signatures, consult the matching `reference/<unit>/` page / `deno doc <module>`; link to it. Do not guess signatures.
4. Front matter: `title`, `templateEngine: [vento, md]` if comps used, `prev`/`next` for ladder/zone pages; layout `base.vto`.
5. **Never touch** `reference/**`, `base.vto`, `styles/`, `_components/*.vto`, catalog, version pins, `packages/`, `plugins/` (LD-DOCS-LANE).
6. End with `deno task --cwd docs/site build` green (0 errors).
7. Match the voice of shipped `why.vto`/`quickstart.vto` (concrete, honest, code-first). Honest about scaffold stubs.

---

## 8. Build Sequencing (waves) & per-page authoring workflow

Authoring uses the Claude workflow `build-doc-site.workflow.js` (one agent per page, schema-validated,
verify + completeness-critic stages) — **launched only after PLAN-EVAL PASS and explicit user GO.**

- **Wave A — connective tissue:** expand `_data.ts` navSections to §2; seed prev/next chains; delete `getting-started.md`.
- **Wave B — Tutorials ladder** (5 rungs, continuous app).
- **Wave C — Explanation** (6 pages).
- **Wave D — Capability hubs** (9 + index).
- **Wave E — How-to** (8 + index refresh).
- **Wave F — Resources** (glossary, cli-reference) + zone index re-skins.

Per wave: author (1 agent/page) → `deno task --cwd docs/site build` green → commit by wave → push →
PR #59 comment (page list + build result) → append `commits.md`. **No merge.**

---

## 9. Evaluation Plan (un-narrowed, whole-tree)

**Gate applicability for the docs surface.** `jsr-audit: N/A — documentation surface, no public API to
audit.` The `static-gates.md` / `fitness-gates.md` boxes from `archetype-gate-matrix.md` (type-check,
lint, fmt of product code) do not apply to authored prose; for this run they are **subsumed by the
single `deno task --cwd docs/site build` gate** (Lume build = 0 errors), which is the authoritative
build-clean verdict per §0.5 and §8.

- **PLAN-EVAL (this step, HARD GATE):** OpenHands `openrouter/minimax/minimax-m3`, adversarial,
  against `.llm/harness/gates/plan-gate.md`. Verifies IA completeness, page-type rigor, accuracy
  markers traceable to ground-truth, scope discipline (reference/base/styles untouched), and that the
  fil d'Ariane is fully specified. Writes `plan-eval.md`; emits PASS or FAIL_PLAN. No authoring before PASS.
- **IMPL-EVAL (step 5):** OpenHands `openrouter/minimax/minimax-m3` — crawls the WHOLE built tree,
  judges learning-curve continuity, breadcrumb/next-prev integrity, feature coverage vs reference
  sites, and ground-truth accuracy. NOT a 3-file read. Writes `evaluate.md`.
- **Final eval (step 7):** OpenHands `openrouter/qwen/qwen3.7-max` — adoption/quality verdict after
  Codex iteration to the bar.

---

## 10. Open Risks / Drift Watch

- Capabilities zone (9 hubs) is entirely net-new and overlaps conceptually with Explanation +
  Reference; briefs keep hubs **thin** (concept + headline API + triplet) to avoid duplicating ref.
- Tutorial continuity depends on the real cross-plugin wiring; if a `plugin add` step diverges from
  the captured scaffold, re-capture ground-truth before authoring that rung (record in `drift.md`).
- P0 search/TOC/copy gaps mean very long pages lean on the right-rail-less layout; mitigated by clean
  heading structure now, component follow-up later.
```
