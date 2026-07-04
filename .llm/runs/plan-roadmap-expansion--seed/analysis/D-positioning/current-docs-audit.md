# Current docs positioning surface — exhaustive audit vs. the storytelling/positioning goal

**Owner's verbatim goal (do not dilute):** "Rework the docs so that one Fable supervisor drives per
feature. Storytelling — each feature told as a story, not a reference dump. An elevator pitch per
feature. Prioritize, showcase, and compare with other frameworks — position each feature against the
competition."

Site root audited: `docs/site/` in the `wt-roadmap-expansion` worktree (current `main`-derived state,
**not** the stale `_plan/00-README.md` baseline — see "Stale baseline" finding below).

## Headline verdict

The site is far richer than the old `_plan/` planning docs assumed: **5 full tutorial tracks** (chat,
erp-sync, live-dashboard, storefront, workspace), **~15 capability hub pages**, **7 explanation
essays**, **9 domain "pillar" folders** (each with an `index.md` + sub-pages), **25 how-to guides**,
plus front-door pages (`index.vto`, `why.vto`, `quickstart.vto`, `concepts.vto`, `glossary.md`,
`cli-reference.md`) and a 29-unit generated `reference/`.

Graded against the owner's three axes:
- **Storytelling: partial.** Tutorials and explanation pages mostly have real narrative openers;
  capability hubs are mostly reference-manual dumps.
- **Elevator pitch per feature: mostly absent.** Only ~4 of ~15 capability hubs open with a punchy
  pitch line.
- **Competitive positioning per feature: almost entirely absent.** Across ~40 feature/capability/
  explanation pages there are exactly **two** named-competitor mentions (Temporal in
  `capabilities/durable-sagas.md`; .NET Aspire in `explanation/aspire.md`, and that one is a
  correction/disambiguation, not positioning). `why.vto` is the only page with a real comparison
  table. **This is the single largest gap versus the owner's brief** and the primary reason Topic D
  exists as a rescope of #232.

There is also a structural IA problem (two unreconciled information architectures — see §3) and one
cross-page factual bug (see §6) the supervisor should resolve before dispatching per-feature rewrite
agents.

## 1. Canonical feature list — as the docs present it today

Derived from `capabilities/index.md`'s own "capability matrix" cross-referenced with the 9 nav
pillars actually wired into `docs/site/_data.ts`, and cross-checked against the live
`packages/`+`plugins/` tree (28 packages + 6 first-party plugins as of 2026-07-04 — grown since the
21-package/4-plugin count recorded in `_plan/09-research-integration.md`; new since that count:
`ai`, `bench`, `auth-better-auth`, `auth-kv-oauth`, `auth-workos`, `plugin-ai-core`,
`plugin-auth-core`, and first-party `plugins/ai`, `plugins/auth`).

| # | Feature | Capability hub | Pillar folder | Explanation | Primary tutorial |
|---|---|---|---|---|---|
| 1 | Services & contracts (Hono+oRPC) | `capabilities/services.md` | `services-sdk/` | `explanation/contracts.md` | storefront/02 |
| 2 | SDK / typed client & query layer | `capabilities/sdk.md` | `services-sdk/` | (contracts) | live-dashboard/03 |
| 3 | Background jobs / workers | `capabilities/background-jobs.md` | `background-processing/` | (durability/observability) | erp-sync, workspace/04 |
| 4 | Polyglot tasks | `capabilities/polyglot-tasks.md` | `background-processing/` | — | erp-sync/03 |
| 5 | Durable sagas | `capabilities/durable-sagas.md` | `durable-workflows/` | `explanation/durability-model.md` | storefront/04 |
| 6 | Triggers & ingress | `capabilities/triggers.md` | `durable-workflows/` | (durability) | storefront/05 |
| 7 | Durable streams | `capabilities/streams.md` | `durable-workflows/` | (durability) | live-dashboard/05 |
| 8 | Authentication (better-auth + adapters) | `capabilities/auth.md` | `identity-access/` | `explanation/auth-model.md` | workspace/02 |
| 9 | Database & Prisma-next | `capabilities/database.md` | `data-persistence/` | — | (various) |
| 10 | KV / queues / cron | `capabilities/kv-queues-cron.md` | `data-persistence/`+`background-processing/` | — | erp-sync/04 |
| 11 | Telemetry / observability | `capabilities/telemetry.md` | `observability/` | `explanation/observability.md` | — |
| 12 | Runtime config | `capabilities/runtime-config.md` | `orchestration-runtime/` | — | — |
| 13 | Orchestration / Aspire | (no hub — asymmetry) | `orchestration-runtime/` | `explanation/aspire.md` | all `/06-deploy` steps |
| 14 | Fresh framework (web layer) | `capabilities/fresh-framework.md` | `web-layer/` | — | live-dashboard/04 |
| 15 | Fresh UI (design system) | `capabilities/fresh-ui.md` | `web-layer/` | — | — |
| 16 | AI stack (durable chat + engine) | `capabilities/ai.md` | `ai/` | — | chat/* |
| 17 | Plugin system (meta-feature, cross-cutting) | — | `orchestration-runtime/` | `explanation/plugin-system.md` | — |
| 18 | CLI / scaffold (`netscript new`, `plugin add`) | referenced from CLI reference, not a hub | — | — | all tutorials, step 1 |
| 19 | Deployment (bare-metal systemd, Deno Deploy) | — | — | how-to guides | all `/06-deploy` |
| 20 | MCP / grounding | not yet a hub-level feature in docs (AI hub touches it) | `ai/` | — | — |

**Asymmetries worth flagging to the prioritization-owning agent:** Orchestration/Aspire has a pillar
+ explanation but **no capability hub**; runtime-config has a hub but the weakest narrative on the
whole site; CLI/scaffold and deployment have no dedicated hub-level page at all despite being named
directly in the owner's brief and in the competitor research as strong positioning material (Encore
file-count before/after, AdonisJS "ship don't assemble," Trigger.dev self-hosting tables). MCP has no
dedicated feature page even though it is one of Encore's and Supabase's sharpest AI-agent stories.

## 2. Per-feature grade (story? pitch? named comparison?)

**Best-in-class today (hits 2-3 of the 3 axes):**
- **`capabilities/durable-sagas.md`** — the *only* page hitting all three. Opens "A saga is the
  answer to the question every retry loop dodges..."; carries the site's one named per-feature
  comparison: "The model is closer to Temporal than to a job queue, but it lives in plain TypeScript
  inside your workspace — no separate cluster to operate."
- **`explanation/observability.md`** — cleanest pain-point pitch: "Most backends bolt observability
  on after the fact... The instrumentation drifts from the code because it was never part of the
  code's shape." No competitor named.
- **`explanation/contracts.md`** — "The contract is not documentation about the boundary — it *is*
  the boundary." Generic-only competitor framing; tRPC never named despite being the obvious
  comparison (flagged in the competitor-teardown research file as the single most natural absent
  comparison in the whole set).
- **`explanation/auth-model.md`** — "Most backend frameworks make a choice for you... Both extremes
  leak the integration tax." Payoff: "you swap the provider by changing one environment variable, not
  your code." Auth.js/Clerk/NextAuth never named.
- **`capabilities/triggers.md`** — "the triggers plugin is NetScript's front door for the outside
  world"; strong narrative, no Zapier/Svix/Hookdeck comparison.
- **`capabilities/telemetry.md`** — "NetScript treats observability as a built-in, not a bolt-on."
- **`capabilities/background-jobs.md`** — narrative opener + jobs/tasks/sagas/services decision
  callout, no competitive framing.

**Front-door pages (already positioning-clean, the template to push down):**
- **`why.vto`** — the one page doing the competitive job well: a "How NetScript compares" table
  naming NestJS, Encore, tRPC-style stacks, Temporal, Hono, plus a genuine "When NetScript is NOT the
  right tool" callout.
- `index.vto`, `concepts.vto`, `quickstart.vto` — on-message, positioning-clean. `concepts.vto` has a
  stale "Still alpha... targeting late 2026" callout vs. the rest of the site's "beta" language —
  minor drift to fix in any rewrite pass.

**Reference-dump offenders, ranked (weakest first):**

Capability hubs:
1. `capabilities/runtime-config.md` — driest of all 15; wall-to-wall apiTables after 2 paragraphs, no
   pitch, no story.
2. `capabilities/services.md` — 9+ back-to-back apiTables; self-describes as a spec ("these are the
   *complete* option keys ... nothing is omitted"). Most painful because oRPC-vs-tRPC is the most
   natural comparison in the whole feature set and it is entirely absent.
3. `capabilities/sdk.md` — 3 major tables + tabbed code, minimal connective prose; TanStack Query
   named only as a dependency, never positioned against.
4. `capabilities/database.md` — file-tree + driver-adapter + tracing tables dominate.
5. `capabilities/auth.md` — "Key types first" = three consecutive type tables, no connective tissue.

Explanation:
1. `explanation/plugin-system.md` — worst in the folder: no hook, no pitch, opens as a TOC-in-prose
   ("This essay explains the mental model behind a NetScript plugin..."). Also carries the factual
   bug in §6 below.
2. `explanation/architecture.md` — opens with a scope-setting question instead of a pitch; literally
   embeds a reference-unit port table inside a "why" essay.

Tutorials (worst track): **erp-sync** — `erp-sync/03-polyglot-transform.md` self-labels "This is a
*documented-capability* chapter, not a hands-on one" and devolves into a 7-row runtime matrix with
only mechanical glue.

## 3. IA question: `capabilities/` vs. the 9 domain "pillar" folders — RESOLVED FINDING

**This is two unreconciled IAs from different eras, not an intentional two-tier design.** Evidence:

- `docs/site/_data.ts` (drives the real `SidebarShell`) states: "Docs-v4 uses the locked
  Capability-Hub IA: ... eight product-area pillars with uniform Overview/Quickstart/How-To/
  Reference leaves..." Its `navSections` lists the **nine domain folders** (Web Layer, Services &
  SDK, Background Processing, Durable Workflows, AI & Agents, Data & Persistence, Identity & Access,
  Orchestration & Runtime, Observability). **`capabilities/` never appears in `_data.ts` at all** —
  zero sidebar presence.
- `index.vto`'s homepage feature grid links only to the nine pillar roots; its CTA reads
  `{ label: "Choose a pillar", href: "/web-layer/" }`. Zero matches for "capabilities" in `index.vto`.
- Yet `capabilities/index.md` describes itself as "the **hub of hubs**" and a top-level "Start here"
  zone, with **no awareness the pillar layer sits above it**.
- The pillar pages disagree with each other about `capabilities/`: `background-processing/` and
  `data-persistence/` route their "Overview & Concepts" card straight into the capability hub
  (making it their concept content); `web-layer/`, `services-sdk/`, and `durable-workflows/`
  **bypass the hub entirely**, linking to `explanation/` or in-folder pages instead; only
  `observability/`, `orchestration-runtime/`, and `ai/` explicitly label `capabilities/` a subordinate
  "hub."
- Content is **not literally duplicated** — pillar index pages are mostly thin card-grids that
  delegate. But `capabilities/` is effectively an orphaned earlier IA generation reachable only via
  in-page xrefs (`comp.xref({ key: "cap:..." })`), never the sidebar or homepage.
- Pillar index pages themselves split into 3 authoring tiers (independent evidence of multiple
  unreconciled authoring passes): thin card-shells (`background-processing`, `data-persistence`,
  `durable-workflows`, `identity-access`, `services-sdk`, `web-layer`), narrative-with-walkthrough
  (`observability`, `orchestration-runtime`), and genuinely story-driven best-in-class (`ai/index.md`
  — two-planes model, shipped-vs-beta.2 callout, real arc, explicitly labels its `capabilities/ai/`
  card "Capability hub").
- Pillar folders also carry substantial *original* content not present in `capabilities/` at all:
  `web-layer/builders.md`, `web-layer/route.md`, `ai/engine.md`, `ai/durable-chat.md`,
  `identity-access/better-auth-plugins.md`.

**Decision the supervisor must make before per-feature rewrites can be dispatched:** promote
`capabilities/` into the nav (merge with pillars), fold its content into the pillar index pages and
delete `capabilities/` as a zone, or explicitly document a two-tier "pillar (nav) → capability hub
(deep dive)" relationship and retrofit every pillar's "Overview & Concepts" card to point at it
consistently (currently only 3 of 9 do this correctly). This is upstream of "one Fable supervisor per
feature" because it determines what a "feature page" even *is* in the shipped nav.

## 4. Best-in-class examples already in the codebase (the bar for rewrites)

1. **`tutorials/storefront/04-checkout-saga.md`** — strongest narrative in the whole site, usable as
   the story-writing template: "Checkout is what turns a cart into an order — and it is the one place
   in a shop where a crash mid-flight costs real money. A naive `async` function that charges a card,
   reserves inventory, then books shipment is a liability: if the process dies after the charge but
   before the reservation, you have taken money and shipped nothing." Grounds a design choice in a
   concrete failure mode — exactly the "story, not reference dump" shape the owner wants.
2. **`tutorials/storefront/index.md`** — best track-level pitch: "It is the same spine the NetScript
   playground runs, re-themed as a shop... every pattern you learn here is one the framework's own
   example app uses in anger." + "reliable instead of hopeful."
3. **`why.vto`** — the competitive-positioning template (the "How NetScript compares" table + "When
   NOT to use" callout) that must be pushed down into each feature page.
4. **`capabilities/durable-sagas.md`** — the one capability hub already hitting story + pitch + named
   comparison; use as the capability-hub template.
5. **`ai/index.md`** — best pillar landing page.
6. **`tutorials/live-dashboard/05-live-stream.md`** — strong before/after arc + a "why this worked"
   callout.

## 5. Locked-positioning violations found

**On shipped/live pages: none.** Independently confirmed across all research passes:
- **No "honesty/candor" framing on any live page.** The banned language ("Honest Maturity Label,"
  "highly honest table," "self-assembly framing + ONE honest table," "Honest Competitive Landscape,"
  "Honest Comparison Narratives") exists **only in the unshipped `_plan/` planning docs**:
  `docs/site/_plan/research/market-fit.md` (multiple hits), `_plan/08-decisions-locked.md` (Q4/Q5),
  `_plan/07-questions-for-user.md`, `_plan/09-research-integration.md`,
  `_plan/briefs/phase-1-front-door.md`. **It did not leak into any rendered page** — but the `_plan/`
  tree is exactly the kind of "prior positioning work" a Fable per-feature dispatch might be tempted
  to lift copy from wholesale, so this is an explicit landmine for the authoring briefs (see
  `context/D-positioning/authoring-constraints.md`).
- **No framework-throughput/performance marketing on live pages.** Every "throughput" hit on a live
  page is scoped infra description, not a NetScript performance claim:
  `capabilities/kv-queues-cron.md` ("RabbitMQ — durable broker for high-throughput, multi-consumer
  queues" — describing RabbitMQ itself, not NetScript), `capabilities/database.md` ("ephemeral or
  high-throughput state ... reach for KV" — routing advice by data shape, not a speed claim),
  `how-to/tune-worker-runtime.md` / `how-to/choose-a-queue-provider.md` /
  `tutorials/erp-sync/04-queue-and-cron.md` (worker-concurrency knob tradeoffs). All acceptable; none
  claim NetScript itself is high-throughput/blazing/scales-to-millions. **Exception (unshipped):**
  `_plan/research/market-fit.md` says "`defineJob` and `defineSaga` add high-throughput background
  tasks" — flag as not-to-be-promoted into any live page.
- **No unshipped-claimed-as-shipped.** Every stub/not-live item (streams manifest helpers,
  `createJobTools` trace no-ops, trigger `defer`, WorkOS/better-auth non-interactive modes, the
  `@netscript/ai` engine pending beta.2, single-tenant vs. multi-tenant) is correctly and plainly
  caveated everywhere it appears, using `<!-- caveat: arch-debt:... -->` markers.

**One factual inconsistency to fix (real bug, not a locked-rule violation):**
`explanation/plugin-system.md` states "There is also no auth telemetry or audit surface yet — do not
assume one exists," which directly **contradicts** `explanation/auth-model.md` ("Auth telemetry is
real: an opt-in, redacted audit surface ships via `createAuthTelemetry`") and
`explanation/observability.md` ("there is now a real, structured, redacted auth audit surface ...
supersedes the older 'auth diagnostics' caveat"). `plugin-system.md` carries a stale under-claim that
should be reconciled by whichever per-feature rewrite touches the plugin-system explanation page.

## 6. Cross-framework comparison outside `why.vto` — the defining gap

**Almost none.** Across ~40 capability/explanation/pillar/tutorial pages there are exactly **two**
named-competitor mentions total:
- `capabilities/durable-sagas.md`: "closer to Temporal than to a job queue."
- `explanation/aspire.md`: "...assumptions people carry from .NET Aspire: 1. It is TypeScript/Node,
  not C#." — a disambiguation/correction, not competitive positioning.

Everything else is generic ("most backend frameworks," "other orchestration frameworks") or silent.
The most natural per-feature comparisons are all missing and map directly onto the competitor
research in `research/D-positioning/competitor-teardown.md` §2: services/sdk vs **tRPC**, streams vs
**Kafka/Debezium/CDC** or **Convex**, kv-queues-cron vs **BullMQ/Celery/Sidekiq**, fresh-ui vs
**shadcn/ui**/Astro, triggers vs **Zapier/Svix/Hookdeck**/Inngest, runtime-config vs
**LaunchDarkly/Unleash**, auth vs **Auth.js/Clerk**/Supabase (Auth0/Okta appear only as OAuth
provider presets, not competitive framing), CLI/scaffold vs **Encore/AdonisJS**, deployment vs
**Trigger.dev/Temporal self-hosting tables**. `why.vto`'s comparison table is the sole exemplar and
should be the cascaded-down model.

## 7. Prior planning-work staleness (drift finding)

`docs/site/_plan/00-README.md`'s problem statement (landing bare, one orphan tutorial, one how-to
guide) does **not** describe the current site — it describes a much earlier baseline that has since
been substantially built out (5 tutorials, 25 how-tos, 15 capability hubs, 7 explanation essays, 9
pillar folders). Any Fable per-feature dispatch must grade the **actual current pages** (this audit),
not re-run the `_plan/` gap analysis as if the site were still bare. The `_plan/09-research-
integration.md` package inventory (21 packages/4 plugins) is also stale relative to the current tree
(28 packages/6 plugins — see §1 above); do not treat it as the final canonical list either.

## 8. What this means for the per-feature Fable-supervisor plan

- Each of the ~20 features/sub-features needs: (a) an elevator-pitch opener (only ~4 currently have
  one), (b) a story arc (tutorials mostly have one, capability hubs mostly don't), (c) a named
  competitive callout (only 1 feature currently has one).
- **The IA question (§3) should be resolved before per-feature rewrite dispatch** — otherwise
  rewritten pages may land in a zone users/agents can't reach via nav.
- Templates to standardize on: `tutorials/storefront/04-checkout-saga.md` (narrative),
  `why.vto` comparison table (positioning), `capabilities/durable-sagas.md` (the one hub already
  doing all three).
- Fix the `plugin-system.md` auth-telemetry contradiction (§5) and the `concepts.vto` "alpha/late
  2026" drift as part of whichever rewrite touches those pages.
- Explicitly instruct every per-feature authoring brief **not** to promote the banned "honest/
  high-throughput" language sitting in `_plan/` planning docs (§5, §7).
