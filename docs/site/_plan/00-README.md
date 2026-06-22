# NetScript Docs — Content Architecture Plan

This directory is the **plan-first** content + IA rebuild for the NetScript public docs site
(`docs/site/`, Lume → GitHub Pages, live at <https://rickylabs.github.io/netscript/>).

It is a **plan, research synthesis, and samples** — NOT a mass rewrite. No tutorial/how-to/
explanation/landing pages are rewritten here. The generated **Reference** docs (`docs/site/reference/`,
produced from `deno doc`) are explicitly **KEPT** and out of scope for rewrite.

## Read order

1. [`01-positioning-brief.md`](./01-positioning-brief.md) — what NetScript is, who for, core values,
   USPs, the "why." Public/marketing-facing narrative.
2. [`02-information-architecture.md`](./02-information-architecture.md) — full nav tree, Diátaxis +
   learning-curve layering, breadcrumb/learning path, and explicit **delete / rewrite / keep** calls
   on current content.
3. [`03-page-outlines.md`](./03-page-outlines.md) — per-section content outlines for every major page
   (landing, quickstart, concepts, each capability, advanced, examples): order, callouts, code-sample
   strategy.
4. [`04-engine-and-components.md`](./04-engine-and-components.md) — Lume + Vento component plan
   (callouts, tabbed code, API tables, hero, feature grid, cards), migration cost, recommendation.
5. [`05-build-migration-plan.md`](./05-build-migration-plan.md) — phased, effort-sized rollout; what
   each phase ships.
6. [`06-reference-site-teardown.md`](./06-reference-site-teardown.md) — concrete IA/onboarding/
   component patterns extracted from Laravel, Medusa, TanStack, Astro, Lume + Vento, and which to steal.
7. [`07-questions-for-user.md`](./07-questions-for-user.md) — crisp questions to lock tone, themes,
   and market positioning before authoring begins.
8. [`samples/`](./samples/) — illustrative drafts (a landing page and a callout component) showing the
   target bar. Samples, not final pages.

## Verdict baseline (the problem we are solving)

The site's **chrome and theme are excellent** (fresh-ui `--ns-*` tokens, SidebarShell, dark/light,
pagefind search) and the **22 generated reference units are stunning** — keep both. The failure is
**content scope, ambition, and marketing grade** in the non-reference lane:

- **Landing (`index.md`)** — a bare Diátaxis directory. No hero, no "what is NetScript," no "why,"
  no audience, no feature grid, no social proof. This is the worst offender.
- **Tutorials** — exactly **one** tutorial (getting-started). No learning path, no second lesson.
- **How-to** — exactly **one** guide (add-a-plugin). No real recipe library.
- **Explanation** — **two** pages (architecture, plugin-model). These are *genuinely good prose* and
  are largely salvageable; they are just isolated and under-linked.

So "placeholder garbage" = **thin coverage + no marketing-grade entry experience**, not lorem ipsum.
The plan treats the existing explanation prose as a quality floor to preserve and build around, and
targets the landing + tutorial + how-to lanes for the biggest lift.

## Research provenance

- **NetScript identity**: read `AGENTS.md`, the 10 doctrine files under
  `docs/architecture/doctrine/`, and the READMEs + `mod.ts` quick-examples of the full package set
  (sdk, service, contracts, plugin, aspire, telemetry, fresh, fresh-ui, cli, database, kv, cron,
  queue, logger) plus the four plugin-core packages and four `plugins/*` packages.
- **Deliverable**: read the CLI scaffold pipeline (`packages/cli/src/kernel/application/scaffold/
  init-pipeline.ts`) and the scaffold asset templates
  (`packages/cli/src/kernel/assets/app/**`, `.../aspire/**`, `.../database/**`).
  **Path taken: template-reading.** Deno 2.8, .NET 10, and Node 22 are all present, but the full
  `scaffold.runtime` E2E (which restores + boots Aspire) is expensive and the mission is plan-first;
  the scaffold templates state precisely what ships, so a live boot was not warranted for a plan.
- **Reference sites**: fetched Laravel, Medusa, Astro, TanStack Query, Lume, and Vento docs; findings
  in `06-reference-site-teardown.md`.
