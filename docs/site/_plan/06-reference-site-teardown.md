# Reference-Site Teardown — Patterns to Steal

Extracted from live fetches of Laravel, Medusa, Astro, TanStack Query, Lume, and Vento docs. Each
entry: the pattern, and the specific NetScript adoption.

## Laravel (laravel.com/docs)
- **Flat, exhaustive, single-version sidebar** grouped by concern (Getting Started → The Basics →
  Architecture Concepts → Security → Database → Eloquent → Testing → Packages). A version switcher
  sits at top.
- **"Getting Started" cluster up front**: Release Notes, Upgrade, Installation, Configuration,
  Directory Structure, Deployment — answers "how do I start and what did I get" immediately.
- **Architecture Concepts as a named section** (Lifecycle, Container, Providers, Facades) — concepts
  are first-class nav, not buried.
- **Adopt:** front-load a "Start here" cluster (Quickstart, Why, first workspace); make "Core
  concepts" a named top section; treat "Directory Structure" → our "what the scaffold made" page.

## Medusa (docs.medusajs.com)
- **Domain-module nav, not package nav.** Features grouped by business function (Cart, Fulfillment,
  Regions) via **feature-grid cards**, each with inline "Learn more."
- **Dual entry points:** beginners → Recipes (production blueprints); developers → Framework
  fundamentals.
- **Recipes = production-ready blueprints** for whole use-cases (marketplace, subscriptions).
- **Adopt:** our **Capability hubs** are the Medusa "modules grid" — group ~14 packages into 9
  intent-named domains with cards. Consider a future "Recipes/Blueprints" lane (a full webhook→job→
  saga→stream pipeline) as the NetScript analog of Medusa recipes.

## Astro (docs.astro.build)
- **Four-rail IA: Tutorial / Guide / Reference / Ecosystem**, with a **6-unit sequential tutorial
  track** (Setup → Pages → Components → Layouts → API → Islands).
- **Asides/callouts, tabbed code, recipe cards, provider grids, inline "next steps" links.**
- **Dual CTAs** (top: Install, middle: Learn, bottom: Extend) and a "Why Astro?" concept entry.
- **Adopt:** the sequential tutorial track (our Learn ladder); inline next-step links at the end of
  every guide; recipe-style how-to cards; the explicit "Why NetScript" entry; multiple CTAs on the
  landing.

## TanStack Query (tanstack.com)
- **The "motivation/overview" page is the marketing engine:** articulate the pain (numbered list) →
  admit it's genuinely hard → present the solution → "enough talk, show me code" minimal working
  example → multi-path learning (course/guide/reference/examples).
- **Framework adapter switcher** (React/Vue/Svelte) keeps one doc, many runtimes.
- **Benefits framed as outcomes** ("make your app feel faster"), not feature lists.
- **Adopt:** build our **Why NetScript** exactly on this template (pain → answer → proof → paths).
  Lead concept pages with a runnable minimal example before theory. Frame USPs as outcomes.

## Lume (lume.land) — how it builds its OWN docs
- **6-section sidebar with descriptive subtitles** (Overview / Configuration / Getting Started /
  Creating Pages / Core / Advanced) — each nav item explains its purpose.
- **Multiple entry points** (themes quick-start, CodeSandbox, deep docs); **next/prev** sequential
  nav; **"Edit this page"** GitHub links; community links in footer.
- **Learn-by-doing** progression, basics → architecture.
- **Adopt:** subtitled nav groups; next/prev (already in our component plan); add "Edit this page"
  (cheap GitHub-link footer) to lower contribution friction; multiple entry points on landing.

## Vento (vento.js.org) + Lume components — the engine we under-used
- Vento: `{{ }}` tags, `{{ if }}`/`{{ for }}`, `|>` filters, async, `{{ layout }}`, `{{ include }}`.
- **Lume `_components/`**: call `comp.name({props})` globally, no imports; **CSS/JS auto-collected and
  emitted only when used**; folder components bundle `comp.vto` + `style.css` + `script.js`.
- **Adopt:** this is the whole component strategy in `04-engine-and-components.md` — callouts, tabbed
  code, hero, cards, feature grid, API tables as `comp.*`, token-styled, zero engine migration.

## Cross-site synthesis — the non-negotiables for the rebuild
1. **A real landing** (hero + what/who/why + feature grid + CTAs) — all five have it; we have a
   directory.
2. **A "Why/motivation" page** — TanStack's strongest asset; we have none.
3. **A sequential tutorial track** — Astro/Lume; we have one orphan tutorial.
4. **Intent-named domain hubs with cards** — Medusa/Astro; we have a flat package list.
5. **Reusable components** (callouts/tabs/cards/grids) — universal; we used none.
6. **Inline next-steps + next/prev + breadcrumbs** — universal learning-curve scaffolding.
