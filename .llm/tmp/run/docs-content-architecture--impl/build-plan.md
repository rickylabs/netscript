# Full Doc-Site Build Plan (Track B, Wave A–F)

Scope approved by user (2026-06-18): **full arborescence**, grounded in the real scaffold, evaluated
un-narrowed across the whole tree. Front door (index/why/quickstart) = already-shipped Phase 1.
Reference lane (`docs/site/reference/**`, 22 units) = **KEEP, do not touch.**

Authority for all commands/endpoints: `ground-truth.md` (this dir) + the live scaffold at
`.llm/tmp/cli-e2e/<name>/`. IA source: `docs/site/_plan/02-information-architecture.md`.

## Connective-tissue mechanics (confirmed from source)

- **Breadcrumb** is auto-rendered by `base.vto` (`{{ comp.breadcrumb() }}`) from `navSections` +
  page url. A page gets a correct trail **iff it is a `navSections` item.** → Wave A expands
  `_data.ts`.
- **nextPrev** is auto-rendered by `base.vto` (`{{ comp.nextPrev({ prev, next }) }}`) from page
  front-matter `prev: { label, href }` / `next: { label, href }`. → each body page sets these.
- **learningPath**: `{{ comp.learningPath({ steps: [{ label, href }] }) }}` — used on zone index +
  landing to visualize the ladder.
- **callout** (body/slot): `{{ comp.callout({ type, title }) }}…inline HTML…{{ /comp }}`
  (type note|tip|important|warning). Markdown-it does NOT process markdown inside the emitted HTML —
  callout bodies are inline HTML.
- **hero / featureGrid / apiTable / tabbedCode / card**: function-call form `{{ comp.NAME({...}) }}`.
- **Landmine**: the literal keyword `function` inside ANY comp-tag arg aborts the build. Use
  arrow/`const` in code samples. (See memory `lume-vento-function-keyword-landmine`.)
- Pages mixing comps + markdown need front matter `templateEngine: [vento, md]`.

## Authoring-agent contract (every page brief inherits this)

1. **Ground every command/endpoint in `ground-truth.md`.** Never invent CLI flags or HTTP paths.
2. Dev-facing install: `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts`
   — never the bare `jsr:@netscript/cli/bin`.
3. For framework API surface, consult `deno doc <module>` / the matching `reference/<unit>/` page;
   do not guess signatures. Link to the relevant `reference/<unit>/` page.
4. Front matter: `title`, `templateEngine: [vento, md]` (if comps used), `prev`/`next` for ladder
   pages. Layout default is `base.vto`.
5. **Never touch** `docs/site/reference/**`, `_includes/layouts/base.vto`, `styles/`, the catalog,
   version pins, `packages/`, or `plugins/`. Docs lane only (LD-DOCS-LANE).
6. End with the build gate green: `deno task --cwd docs/site build` (0 errors).
7. Match the voice of the shipped `why.vto`/`quickstart.vto` (concrete, honest, code-first).

## Target navSections (Wave A central edit to `_data.ts`)

```
Start here:   Home /  · Quickstart /quickstart/ · Why NetScript /why/
Learn:        Tutorials /tutorials/ · First workspace /tutorials/first-workspace/
              · Build a service /tutorials/build-a-service/ · Add background jobs /tutorials/background-jobs/
              · A durable workflow /tutorials/durable-workflow/ · Ingest a webhook /tutorials/ingest-webhook/
How-to:       How-to /how-to/ · Add a plugin /how-to/add-a-plugin/ · Add a service /how-to/add-a-service/
              · Database & migration /how-to/database-migration/ · Queue/KV/cron /how-to/queue-kv-cron/
              · Add OpenTelemetry /how-to/add-opentelemetry/ · Customize Fresh UI /how-to/customize-fresh-ui/
              · Deploy /how-to/deploy/ · Author a plugin /how-to/author-a-plugin/
Core concepts:Explanation /explanation/ · Architecture /explanation/architecture/
              · Contracts & type flow /explanation/contracts/ · Plugin model /explanation/plugin-model/
              · Durable workflows /explanation/durable-workflows/ · Observability /explanation/observability/
              · Aspire orchestration /explanation/aspire/
Capabilities: /capabilities/services/ · /capabilities/background-jobs/ · /capabilities/durable-sagas/
              · /capabilities/triggers/ · /capabilities/streams/ · /capabilities/database/
              · /capabilities/kv-queues-cron/ · /capabilities/telemetry/ · /capabilities/fresh-ui/
Reference:    Reference index /reference/  (+ existing 22 Reference units — UNCHANGED)
Resources:    Glossary /glossary/ · CLI reference /cli-reference/
```

Breadcrumb resolves the most specific match (deepest-prefix item wins by list order); list each zone
index BEFORE its children so child pages win the final crumb.

## Page inventory + briefs

### Wave A — ground truth + connective tissue
- **`_data.ts`** — expand `navSections` to the tree above. [central]
- **`tutorials/getting-started.md` → split**: lean content → `quickstart` (already shipped); deep
  content → new `tutorials/first-workspace.md`. Delete/replace the stale file. Fix install command.
- **Learning-path cards + prev/next chains** seeded on existing zone indexes.

### Wave B — Tutorials (ladder; each sets prev/next)
1. `tutorials/first-workspace.md` [REWRITE/EXPAND] — init → what each generated dir is → `aspire run`
   → dashboard at :18888. Chain: prev Quickstart → next Build a service.
2. `tutorials/build-a-service.md` [NEW] — contract → service (`--service-name`) → typed client →
   island. Real users service (port from scaffold). next → Add background jobs.
3. `tutorials/background-jobs.md` [NEW] — `plugin add worker --samples`; define a job; hit
   `:8091/api/v1/workers/jobs`, trigger, `/executions`. next → A durable workflow.
4. `tutorials/durable-workflow.md` [NEW] — `plugin add saga`; model a multi-step flow; sagas API
   `:8092/api/v1/sagas/{sagas,instances}`. next → Ingest a webhook.
5. `tutorials/ingest-webhook.md` [NEW] — `plugin add trigger`; POST `:8093/api/v1/webhooks/inbound/generic`
   → job; `/api/v1/events`. Closes the ladder.

### Wave C — Core concepts (Explanation)
- `explanation/architecture.md` [KEEP prose; soften 2 doctrine terms; add breadcrumb via nav].
- `explanation/contracts.md` [NEW] — oRPC contract → client → query → island type flow.
- `explanation/plugin-model.md` [KEEP prose, relink].
- `explanation/durable-workflows.md` [NEW] — state machines, correlation, compensation.
- `explanation/observability.md` [NEW] — OTel spans, structured logs, health endpoints, Aspire traces.
- `explanation/aspire.md` [NEW] — AppHost (`aspire/apphost.mts`), resources, dashboard, restore/start.

### Wave D — Capability hubs (9; thin concept + headline API + routes to tutorial/how-to/reference)
services · background-jobs · durable-sagas · triggers · streams · database · kv-queues-cron ·
telemetry · fresh-ui. Each: 1-screen concept, the headline API (from `reference/<unit>/`), and a
"Learn / Do / Reference" link triplet.

### Wave E — How-to recipes (task-oriented)
add-a-plugin [KEEP] · add-a-service · database-migration (`db init/generate/seed`) · queue-kv-cron ·
add-opentelemetry · customize-fresh-ui (`ui:init`/`ui:add`) · deploy · author-a-plugin (wave-2).

### Wave F — Resources + zone re-skins + eval
- `glossary.md` [NEW] — saga, trigger, stream, contract, contribution, archetype, plugin, AppHost…
- `cli-reference.md` [NEW] — curated companion to `reference/cli/`, grouped by workflow.
- Re-skin `tutorials/index.md`, `how-to/index.md`, `explanation/index.md`, plus a `capabilities/index.md`,
  each with a learningPath card + accurate cross-links.
- **Full-site eval** (un-narrowed): IMPL-EVAL (minimax-m3) + adoption-eval (qwen3.7-max), each
  instructed to crawl the WHOLE tree and judge learning-curve continuity, breadcrumb/next-prev
  integrity, and feature coverage vs Laravel/Astro/Medusa/TanStack. NOT a 3-file read.

## Per-wave cadence
author (docs workflow, 1 agent/page, grounded) → `deno task --cwd docs/site build` green →
commit by wave → push → PR #59 comment with page list + build result → append `commits.md`. No merge.
