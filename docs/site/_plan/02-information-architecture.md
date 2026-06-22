# Information Architecture

Diátaxis remains the backbone (Tutorials / How-to / Reference / Explanation), but the current site
treats Diátaxis as the *top-level menu*, which is wrong for a marketing-grade site: it forces a new
visitor to self-diagnose their "documentation mode" before they know what NetScript is. The reference
sites we studied (Laravel, Astro, Medusa, TanStack) all front-load **product → quickstart →
concepts** and let Diátaxis organize the *body*, not the front door.

## Target nav tree

The sidebar (driven by `_data.ts` `navSections`) becomes a learning-curve ladder. Diátaxis is
preserved as the organizing principle of each zone but is no longer the first decision.

```
Start here
  Home / Overview              (landing — what / who / why / feature grid)        [REWRITE]
  Why NetScript                (positioning + comparison; the "motivation" page)   [NEW]
  Quickstart (5 min)           (init → run → see it working; the happy path)       [REWRITE from getting-started]

Learn  (Tutorials — learning-oriented, sequential)
  1. Your first workspace      (deep version of quickstart; what each phase made)  [REWRITE/EXPAND]
  2. Build a service           (contract → service → typed client → island)        [NEW]
  3. Add background jobs       (workers plugin: define a job, run it, trace it)     [NEW]
  4. A durable workflow        (sagas: model a multi-step flow as a state machine)  [NEW]
  5. Ingest a webhook          (triggers: webhook → job, end to end)                [NEW — optional wave 2]

Core concepts  (Explanation — understanding-oriented)
  Architecture overview        (the published-surface thesis, archetypes)          [KEEP, relink]
  Contracts & the type flow    (oRPC contract → client → query → island)           [NEW]
  The plugin model             (plugins vs core; manifests; registries)            [KEEP, relink]
  Durable workflows            (state machines, correlation, compensation)         [NEW]
  Observability & telemetry    (OTel spans, structured logs, health)               [NEW]
  Orchestration with Aspire    (AppHost, resources, the dashboard)                 [NEW]

Capabilities  (per-domain landing pages: concept + key API + links to ref/how-to)
  Services & contracts         (service, contracts, sdk)                           [NEW]
  Background jobs (workers)                                                          [NEW]
  Durable sagas                                                                      [NEW]
  Triggers & ingress                                                                 [NEW]
  Durable streams                                                                    [NEW]
  Data: database & Prisma                                                            [NEW]
  KV, queues & cron            (the integration trio)                               [NEW]
  Telemetry & logging                                                                [NEW]
  Fresh UI & design system                                                           [NEW]

How-to guides  (task-oriented recipes)
  Add a first-party plugin     (workers/sagas/triggers/streams)                     [KEEP]
  Add an example service                                                             [NEW]
  Add a database & run a migration                                                   [NEW]
  Wire a queue / KV / cron job                                                       [NEW]
  Add OpenTelemetry to a service                                                     [NEW]
  Customize the Fresh UI (ui:init / ui:add)                                          [NEW]
  Deploy a NetScript workspace                                                       [NEW]
  Author your own plugin       (advanced)                                            [NEW — wave 2]

Reference  (information-oriented — GENERATED, KEEP AS-IS)
  Overview index
  22 generated units (aspire … workers)                                             [KEEP — do not touch]

Resources
  CLI command reference        (curated companion to cli ref)                       [NEW — wave 2]
  Glossary                     (saga, trigger, contribution, archetype, contract)   [NEW]
  Changelog / releases         (optional)                                            [optional]
```

## Learning-curve / breadcrumb ("fil d'Ariane")

Two complementary devices, both proven on the reference sites:

1. **Sequential next/prev** within Tutorials and the Capabilities lane (Lume, Astro pattern). Each
   tutorial ends with a "Next → …" link; the chain forms the guided learning path.
2. **Breadcrumb trail** at the top of every body page reflecting the nav hierarchy
   (`Learn / Build a service`, `Capabilities / Durable sagas`). Lume nav items can carry a subtitle
   describing intent (Lume's own docs do this) — adopt for the sidebar groups.

A small **"learning path" card** on the landing + each tutorial index visually orders the ladder
(Quickstart → first workspace → service → jobs → workflow), mirroring Astro's 6-unit tutorial track.

## Diátaxis mapping (preserved, demoted to organizing principle)

| Zone in nav | Diátaxis mode | Why it sits here |
| --- | --- | --- |
| Quickstart, Learn | **Tutorial** | learning-oriented, sequential, guaranteed-to-succeed |
| How-to guides | **How-to** | task-oriented recipes for users who know the basics |
| Reference | **Reference** | information-oriented, generated, exhaustive |
| Core concepts | **Explanation** | understanding-oriented prose |
| Capabilities | **hybrid hub** | a thin per-domain landing that *routes* to the four modes |

The Capabilities lane is the one deliberate departure from pure Diátaxis: it is the "Medusa Commerce
Modules / Astro features" pattern — a domain hub that gives a one-screen concept + the headline API +
links into tutorial, how-to, and reference for that capability. This is what makes a framework with
~14 packages navigable by *intent* rather than by *package name*.

## Explicit delete / rewrite / keep calls

### KEEP (do not touch)
- `docs/site/reference/**` — all 22 generated units. The crown jewel. Out of scope.
- `docs/site/_includes/layouts/base.vto`, `styles/`, theme, pagefind, code-highlight, base_path,
  markdown-it-anchor config — the chrome is excellent. (Augment with components; do not replace.)
- The **prose** of `explanation/architecture.md` and `explanation/plugin-model.md` — genuinely good.

### REWRITE (content is thin or wrong altitude)
- `index.md` (landing) — **highest priority.** Replace the bare Diátaxis directory with a hero +
  "what/who/why" + feature grid + learning-path card + quickstart CTA. (See sample.)
- `tutorials/getting-started.md` → split into **Quickstart (5 min)** (the lean happy path) and
  **Tutorial 1: Your first workspace** (the deep, explains-each-phase version). The current content is
  solid raw material for the deep version.
- `tutorials/index.md`, `how-to/index.md`, `explanation/index.md` — re-skin as zone landing pages
  with the learning-path card and accurate cross-links once siblings exist. The current
  "Diátaxis-explainer" framing is too inward; lead with what you can learn/do here.

### RELINK / RE-HOME (good content, wrong isolation)
- `explanation/architecture.md` → **Core concepts / Architecture overview**; soften two doctrine
  terms for a public reader ("fitness functions", "composition root") with a one-line gloss or move
  them behind a "for framework authors" aside.
- `explanation/plugin-model.md` → **Core concepts / The plugin model** (largely as-is).

### NET-NEW (the bulk of the lift)
- Everything marked `[NEW]` above: Why NetScript, 4–5 tutorials, 6 core-concept pages, 9 capability
  hubs, 6–7 how-to recipes, glossary, curated CLI reference.

### Net assessment of "placeholder garbage"
There is **no literal placeholder/lorem** content — the existing pages are real, competently written
prose. The deficiency is **scope and front-door experience**: 4 body pages + a directory-style
landing cannot carry a framework of this size to the Laravel/Astro bar. The rebuild is ~80%
**net-new authoring** and ~20% **re-home/re-skin**, with **zero** rewriting of the reference lane.
