# Matrix of resources — Topic D (per-feature storytelling / positioning docs)

Per the run's B1 contract: a matrix of all useful resources for this topic, plus an index into the
matching `analysis/D-positioning/` (B2) and `research/D-positioning/` (B3) outputs.

## In-repo prior art (already exists — read in full for this pass)

| Resource | Path | What it gives |
|---|---|---|
| Prior positioning brief | `docs/site/_plan/01-positioning-brief.md` | 3 candidate hero headlines, 7 USPs, core-values table, tone guidance, **master ~40s elevator pitch** (reusable raw material — see `context/D-positioning/elevator-pitch-raw-material.md`) |
| Prior locked decisions | `docs/site/_plan/08-decisions-locked.md` | Q1-Q14 answers on hero/tone/audience/competitive framing/maturity/Aspire emphasis/phasing. **Contains banned "honest/honesty" framing (Q4/Q5) — superseded by the newer locked rule; do not reuse that phrasing.** Dated 2026-06-19, predates the 2026-07-04 ratified decisions in `specs/01`. |
| Market-fit research | `docs/site/_plan/research/market-fit.md` | Market-gap narrative, positioning pillars, explicit NetScript-vs-4-siblings comparison table, "Honest Competitive Landscape" section (banned framing — flag only, do not reuse title), 5-phase adoption story. Also has a "high-throughput" phrase that conflicts with the locked no-throughput-claims rule. |
| Feature landscape (stale) | `docs/site/_plan/research/netscript-feature-landscape.md` | 7-package/4-plugin inventory — **superseded**, do not use as final feature list (28 packages/6 plugins today; see `analysis/D-positioning/current-docs-audit.md` §1 for the current canonical list). |
| Research integration synthesis | `docs/site/_plan/09-research-integration.md` | Most load-bearing prior-art file: authoritative (at the time) package inventory, verified tech-stack claims, accuracy guardrail (`deno doc` is the API authority), 5 Lume engine decisions, **competitor-exemplar-per-page table** (directly cross-checked against the fresh competitor research in `research/D-positioning/competitor-teardown.md`), PLAN-EVAL history. |
| IA plan | `docs/site/_plan/02-information-architecture.md` | Target nav tree, KEEP/REWRITE/RELINK/NET-NEW calls — now superseded by the actual shipped `_data.ts` nav (9 pillars); useful as a historical baseline only. |
| Page outlines | `docs/site/_plan/03-page-outlines.md` | Per-page content outlines incl. global code-sample-strategy rules — still broadly applicable to rewrite briefs. |
| Reference-site teardown | `docs/site/_plan/06-reference-site-teardown.md` | Patterns stolen from Laravel/Medusa/Astro/TanStack/Lume/Vento docs sites (structural/IA patterns, not competitive-comparison content — complements the fresh competitor research which is comparison-page-specific). |
| Open questions (historical) | `docs/site/_plan/07-questions-for-user.md` | Q1-Q14 draft questions; largely answered/superseded by `specs/01-ratified-decisions.md`, but Q4 (competitive framing) and Q7 (Aspire emphasis) are directly relevant to Topic D's per-feature comparison mandate. |
| Accuracy worklog example | `docs/site/_plan/worklog/index.md` | Worked example of the accuracy-verification mechanism (claim → verification command → found?) — the mechanism any per-feature comparison claim should also pass through. |
| In-repo competitor teardowns (pre-existing) | `docs/site/_plan/research/competitors/{encore,medusa,trpc,temporal,astro,hono,laravel,lume,nestjs,tanstack}.md` | 10 files, all read in full as Step 1 of the B3 competitor research pass — see `research/D-positioning/competitor-teardown.md` for the synthesis plus 6 fresh live-fetched competitors (Convex, Supabase, Inngest, Trigger.dev, AdonisJS + deepened Encore/Medusa/tRPC/Temporal/NestJS). |

## Current live docs site (the actual surface to rework)

| Zone | Path | Role |
|---|---|---|
| Front door | `docs/site/{index,why,quickstart,concepts}.vto`, `glossary.md`, `cli-reference.md` | `why.vto` is the one page already doing the competitive-comparison job well — the template to cascade down. |
| Capability hubs (~15 pages) | `docs/site/capabilities/*.md` | Orphaned IA zone (no nav/homepage presence) — see `analysis/D-positioning/current-docs-audit.md` §3 for the full IA-reconciliation finding. |
| 9 domain "pillar" folders | `docs/site/{web-layer,services-sdk,background-processing,durable-workflows,ai,data-persistence,identity-access,orchestration-runtime,observability}/` | The **actual** primary nav (wired into `_data.ts`); split into 3 authoring-quality tiers (thin shell / narrative / story-driven best-in-class). |
| Explanation essays (7) | `docs/site/explanation/*.md` | Concept-first pages; several already carry usable elevator-pitch openers. |
| Tutorials (5 tracks) | `docs/site/tutorials/{chat,erp-sync,live-dashboard,storefront,workspace}/` | Best storytelling in the whole site (esp. `storefront/04-checkout-saga.md`) — the narrative template. Owned by Topic C (tutorial rewrites), not D, but the *technique* is directly reusable for D. |
| How-to guides (25) | `docs/site/how-to/*.md` | Diátaxis task recipes — out of scope for storytelling rework (how-tos are supposed to be terse), but source of real usage snippets. |
| Generated reference (29 units) | `docs/site/reference/*` | API-accuracy ground truth; every comparison/capability claim in a rewritten page must trace back to this or to `deno doc`, never invented. |

## GitHub issues (fetched live via `gh`)

| Issue | State | Relevance |
|---|---|---|
| `#232` — "docs: march to 0.0.1-stable — coverage & accuracy umbrella" | OPEN | The umbrella Topic D rescopes. **As currently scoped it is 100% accuracy/coverage work (storefront tutorial grounding, fresh-ui reference depth, Aspire/telemetry docs gaps, streams docs-scoping decision, workers verification) — zero storytelling/positioning/elevator-pitch/competitive-comparison content.** Confirms Topic D adds genuinely new scope rather than overlapping existing #232 items. |
| `#302` — "[S1] Positioning + netscript-bench" | OPEN | **Adjacent, not gating.** Owns `netscript-bench` — the measurement instrument for the AI-agent-build-efficiency claim (turns_to_green, cost, production-rubric-pass-rate). Ratified as a **post-stable fast-follow** (R1), not a hard cut gate. Relevant context for Topic D: it's the eventual *evidence* source for any measured build-efficiency claim (paralleling Supabase's 58%→71% technique in the competitor research) — but Topic D's docs rewrite must not wait for or fabricate numbers from an instrument that doesn't exist yet. |
| `#301` — "Epic: Road to 0.0.1-stable" | OPEN | Parent umbrella of both `#232` and `#302`. |

## Live competitor sources (fetched this pass — see `research/D-positioning/competitor-teardown.md` for full extraction)

Encore.dev, Medusa, tRPC, Temporal.io, NestJS, Convex, Supabase, Inngest, Trigger.dev, AdonisJS — 10
competitors total (4 named in the topic spec + 6 extra). Each has: verbatim hero/positioning quotes,
comparison-page technique notes, a landmine callout, and full citation list.

## eis-chat reference (elevator-pitch raw material)

See `context/D-positioning/` for the extracted per-feature evidence. Reading map is in
`specs/02-eis-chat-reference.md` §"C/D — real-project story": `docs/PRODUCT.md`,
`docs/ARCHITECTURE.md`, `docs/SKILL.md`, `docs/PHASE-1..7-*.md`, `docs/HANDOVER.md`,
`docs/INDEX.md`, `docs/assets/*.png` screenshots. Seam dogfooding paths: `services/eischat`,
`streams`, `workers`+`workers-api`, `plugins`, `contracts`, `database`, `aspire`,
`.netscript/generated/plugin-workers/job-registry.ts`.

## Index into B2 / B3

- `analysis/D-positioning/current-docs-audit.md` — exhaustive current-state audit: canonical feature
  list, per-feature story/pitch/comparison grade, the `capabilities/` vs. pillar-folder IA
  reconciliation finding, ranked reference-dump offenders, best-in-class examples, locked-positioning
  violation check (none live, several in unshipped `_plan/`), the plugin-system factual bug, and the
  `_plan/00-README.md` staleness finding.
- `research/D-positioning/competitor-teardown.md` — the full competitor extraction: per-competitor
  findings with verbatim quotes and citations, a feature-by-feature "sharpest comparison" mapping
  table, and a landmines section (claims NetScript must not copy).
- `context/D-positioning/` — elevator-pitch raw material, authoring-constraint checklist for the
  per-feature Fable-supervisor briefs, and the mandatory `open-questions.md`.
