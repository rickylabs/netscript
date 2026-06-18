# Build & Migration Plan (phased, effort-sized)

Effort sizes are relative (S ≈ a few hours, M ≈ ~1 day, L ≈ multi-day) and assume one author working
with the package READMEs as the source for code samples. **No reference-lane pages are touched in any
phase.** Each phase is independently shippable to GitHub Pages.

## Guardrails (all phases)

- DOCS lane only. No edits to `packages/`, `plugins/`, version pins, or lock files. Respect the
  dependency catalog law.
- Code samples are lifted from real `mod.ts` / README quick-examples — never invented APIs.
- After each phase: `deno task` build of the site locally + visual check; keep pagefind/base_path/
  anchors intact. Validate doc samples compile where feasible (samples mirror published surfaces).
- Lock tone/positioning (questions in `07-`) **before** Phase 1 authoring of the landing/why pages.

## Phase 0 — Foundations (engine + IA scaffolding) · **M**
Produces the skeleton everything else fills.
- Add `docs/site/_components/` with P0 components: `callout`, `tabbedCode`, `hero`, `card` +
  `featureGrid`. Token-styled.
- Add the markdown-it GitHub-callout shim to `_config.ts`.
- Restructure `_data.ts` `navSections` to the new ladder (Start here / Learn / Core concepts /
  Capabilities / How-to / Reference / Resources). Add per-group subtitles.
- Add `comp.breadcrumb` + `comp.nextPrev` to the base layout.
- **Ship:** same content, new chrome/nav + working components (verified with the samples in
  `_plan/samples/`).

## Phase 1 — The front door (highest user-visible ROI) · **M**
- Rewrite `index.md` → `.vto` landing (hero, feature grid, audience cards, learning-path, CTAs).
- Author **Why NetScript** (`why.vto`) — the motivation page.
- Split `getting-started.md` → lean **Quickstart** + seed of **Tutorial 1**.
- Re-home `explanation/architecture.md` + `plugin-model.md` into Core concepts; gloss doctrine terms.
- **Ship:** a site that *sells* NetScript on first contact and gets a reader running in 5 minutes.

## Phase 2 — The learning track (Tutorials) · **L**
- Tutorial 1 (first workspace, expanded), 2 (build a service), 3 (background jobs), 4 (durable
  workflow). Wire next/prev + learning-path card.
- Re-skin `tutorials/index.md` as a track landing.
- **Ship:** a guaranteed-success path from zero to a service + a job + a saga.

## Phase 3 — Capability hubs + remaining core concepts · **L**
- 9 capability hubs (services/contracts, workers, sagas, triggers, streams, database, kv/queue/cron,
  telemetry/logging, fresh-ui) — each the thin concept + headline API + Diátaxis router card.
- Core-concept pages: Contracts & the type flow, Durable workflows, Observability, Aspire.
- **Ship:** every package reachable by *intent*, not just by name in the reference list.

## Phase 4 — How-to library + Resources · **M**
- 6–7 new recipes (service, database+migration, queue/kv/cron, OTel, customize UI, deploy).
- Glossary; curated CLI command reference companion.
- Re-skin `how-to/index.md`.
- **Ship:** the task-oriented lane is real, not a single recipe.

## Phase 5 — Polish & wave-2 · **M (optional)**
- Tutorial 5 (webhook ingress), "author your own plugin" advanced guide, changelog/releases page.
- Cross-link audit, search-term tuning, a11y pass, OG/meta + social cards.
- **Ship:** completeness + discoverability at the reference-site bar.

## Sequencing rationale
- Phase 1 first because the landing is the worst current offender and the cheapest big win.
- Components (Phase 0) precede everything because every later page depends on them.
- Tutorials before capability hubs because hubs *link into* tutorials (the Diátaxis router cards need
  destinations).
- How-to last of the substantive phases because recipes assume the concepts/tutorials exist to link.

## What each phase produces (artifact summary)
| Phase | New/changed pages | New components | Net-new authoring |
| --- | --- | --- | --- |
| 0 | `_data.ts`, base layout | callout, tabbedCode, hero, card, featureGrid, breadcrumb, nextPrev | none |
| 1 | landing, why, quickstart, 2 re-homed concepts | — | high (landing+why) |
| 2 | 4 tutorials + track index | learningPath | high |
| 3 | 9 hubs + 4 concepts | apiTable | high |
| 4 | 6–7 how-tos, glossary, CLI ref | — | medium |
| 5 | wave-2 pages + polish | versionBadge | medium |
