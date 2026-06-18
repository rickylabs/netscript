# 09 — Deep-Search Research Integration (Stage 2)

Reconciles the 15 Gemini-3.5-Flash deep-search artifacts under `research/` (committed `d6f4c2ae`)
with the pre-existing plan (`00`–`08`, decisions locked in `08`). This is the **supervisor's Stage-2
synthesis**: it does not rewrite the locked plan; it records where research **confirms**, where it
**adds**, and where it **diverges** — surfacing each divergence as an explicit decision point for the
adversarial PLAN-EVAL (Stage 3, Minimax-M3) to push on.

> Scope note: this is a planning artifact (docs lane). No `packages/`/`plugins/` source, no engine
> swap is enacted here — only proposed. PLAN-EVAL adjudicates the open decisions before any authoring.

## 1. Where research CONFIRMS the locked plan (high agreement)

The deep-search independently reproduced the plan's core theses — strong corroboration:

- **Extend Lume/Vento, do not migrate** (`04` ↔ `lume-vento-plugins.md`). Both reject MDX/JSX/engine
  swaps; both treat the gap as a missing **component layer**, not a missing engine.
- **Demote Diátaxis from front door to organizing principle** (`02` ↔ `doc-architecture-patterns.md`
  §2). Front-load product → quickstart → concepts; let Diátaxis structure the body. Astro/Laravel/
  Medusa/TanStack all do this.
- **Capability-Hub navigation by intent, not package name** (`02` Capabilities lane ↔ patterns §3,
  finding #1). Both prescribe plain-English hub labels — already **locked** in `08` Q14
  ("Background jobs", "Durable workflows", "Event triggers", "Streams").
- **Outcome-led hero + honest "self-assembly" gap pitch** (`01`/`08` Q1 ↔ `market-fit.md` §1–2,
  findings #7/#8). Research's hero candidate is verbatim the locked `08` Q1 choice (C-outcome + B-sub).
- **Code samples lifted from real `mod.ts`/READMEs, never invented** (`03`/`05` ↔ patterns §4).
- **Alpha maturity, React-Native posture; Aspire hero-level + `--no-aspire` opt-out** (`08` Q5/Q7 ↔
  `market-fit.md` §2B/2C, findings #5/#6).

Net: the plan's direction is validated by an independent research pass. The value the deep-search
adds is in the **engine-feature layer** (§3) and **competitor-grade execution detail** (§4).

## 2. Accuracy corrections (supervisor ground-truth — binding on authors)

The research prose is directionally right but **undercounts and loosely names** the surface. Authors
must use the **authoritative inventory below**, verified against the repo, not the research prose.

### 2a. Authoritative package/plugin inventory (verified `release/jsr-readiness`)

**21 packages** declare `@netscript/*`:
`aspire, config, contracts, cron, database, fresh, fresh-ui, kv, logger, plugin, plugin-sagas-core,
plugin-streams-core, plugin-triggers-core, plugin-workers-core, prisma-adapter-mysql, queue,
runtime-config, sdk, service, telemetry, watchers`.

**4 consumer plugins** (`plugins/*`): `@netscript/plugin-{sagas,streams,triggers,workers}` (each a
publishable plugin over its sibling `-core` package).

> The research's "namespace = service/contracts/sdk/kv/queue/cron/telemetry" (in
> `netscript-feature-landscape.md` and `00-research-summary.md`) is a **subset**. It omits `aspire`,
> `config`, `database`, `fresh`, `logger`, `plugin`, `prisma-adapter-mysql`, `runtime-config`,
> `watchers`. Capability hubs and the feature grid must cover the full set (the Reference lane already
> ships the generated units — `06`; do not re-author it).

### 2b. Tech-stack claims — VERIFIED real (not hallucinations), use confidently

Ground-truth grep on `packages/` confirmed the research's stack claims are grounded:

- **Hono + oRPC** — 66 occurrences across 15 files in `packages/service`. The "oRPC + Hono service
  runtime" framing is accurate (matches `01`).
- **Fedify** — real dependency referenced in `packages/queue` and `packages/kv` (11 files). The
  parallel-queue claim is grounded; verify the exact mechanism/wording via `deno doc @netscript/queue`
  before asserting "concurrent execution buffers".
- **Nitro** — real driver reference in `packages/kv` (3 files). KV provider matrix may include it;
  confirm the exact adapter list via `deno doc @netscript/kv` (do not assert Redis/Nitro/memory from
  prose alone).
- **Prisma** — confirmed by `@netscript/prisma-adapter-mysql` existing; database lane is Prisma-backed
  (matches `01`).

### 2c. Accuracy guardrail (reinforced for every brief)

Every NetScript API symbol, adapter name, provider list, and signature in authored docs MUST be
verified against `deno doc <module>` (and `--filter <symbol>`) and the unit's `mod.ts`/README at
authoring time. **Research prose is a secondary source for narrative only, never the API authority.**
If `deno doc` and a research file disagree, `deno doc` wins and the divergence is noted in the page's
worklog. This is the contract-first rule (`AGENTS.md` §2) applied to docs.

## 3. Engine-feature decision points (research ADDS; PLAN-EVAL to adjudicate)

`lume-vento-plugins.md` proposes five Lume plugins the current `04` plan does not adopt. Each is a
**decision point** below with a supervisor recommendation. The locked `08` does not cover these, so
they are open for PLAN-EVAL. None blocks Phase-0 component work; they layer onto it.

| # | Decision | Current plan (`04`) | Research proposal | Supervisor recommendation |
| - | -------- | ------------------- | ----------------- | ------------------------- |
| D-E1 | Sidebar generation | Manual `_data.ts navSections` ladder | `lume/plugins/nav.ts` folder-derived tree | **Hybrid**: keep curated `navSections` for the top-level learning-curve ladder (Start here → Learn → Capabilities…), whose intent-ordering `nav.ts` cannot infer; consider `nav.ts` only for the auto-generated **Reference** sub-tree. Adopt only if it doesn't fight the ladder ordering. |
| D-E2 | Syntax highlighting | Keep current `codeHighlight` (Prism) | `lume/plugins/shiki.ts` (TextMate/VS Code grammar) | **Adopt Shiki.** Strongest single DX lever for a TS-first framework: IDE-grade token fidelity on `@netscript/sdk` samples. Verify it composes with pagefind + base_path + the anti-flash theme before committing; fall back to Prism if it breaks the chrome. |
| D-E3 | On-page TOC ("On this page") | Absent (plan has breadcrumb + nextPrev only) | `lume/plugins/toc.ts` (h2–h4 → sticky right rail) | **Adopt.** Clear additive win; every long reference/concept/how-to page needs it (finding #3). Low risk. |
| D-E4 | SEO sitemap | Absent | `lume/plugins/sitemap.ts` | **Adopt** (cheap, post-Pages-deploy SEO; finding, low-leverage but free). Confirm base_path correctness in emitted URLs. |
| D-E5 | Auto-rendered index cards | Manual `comp.card` lists on zone indexes | `lume/plugins/search.ts` + `search.pages(...)` | **Defer to wave 2.** The manual `comp.featureGrid`/`comp.card` already covers Phase 1–3; auto-cards are a nice-to-have that can replace hand lists once the taxonomy/front-matter tags stabilize. |

Component mechanism note: `04` uses Lume **`_components/`** (global `comp.*`); the research describes
Vento **`{{ include }}`** templates. These are two routes to the same outcome. Keep `04`'s
`_components/` decision as primary (auto CSS/JS collection is a real benefit); `{{ include }}` is an
acceptable fallback for any spark widget that doesn't fit the component model.

## 4. The ten highest-leverage findings → phase mapping

From `00-research-summary.md §2`, mapped onto the locked `05` build phases so authors know where each
lands:

| Finding | Lands in | Action |
| ------- | -------- | ------ |
| #1 Plain-English hub labels | Phase 0 (`navSections`) | Already locked `08` Q14; enforce in nav + hub titles. |
| #2 `nav.ts` dynamic sidebar | Phase 0 | **D-E1** (hybrid; PLAN-EVAL). |
| #3 `toc.ts` sticky on-page TOC | Phase 0 (layout) | **D-E3** adopt; wire into base layout. |
| #4 Shiki highlighting | Phase 0 (`_config.ts`) | **D-E2** adopt (with chrome-compat check). |
| #5 Aspire USP + `--no-aspire` | Phase 1 (landing/why) + Phase 3 (Aspire concept) | Locked `08` Q7; foreground on front door, explicit opt-out callout. |
| #6 Alpha / React-Native posture | Phase 1 (why) + global maturity badge | Locked `08` Q5; honest label, target Beta end-2026. |
| #7 Outcome-led hero | Phase 1 (landing) | Locked `08` Q1; verbatim hero. |
| #8 Stop hand-assembling pitch | Phase 1 (why) | Anchor the "why" page; one honest table (locked `08` Q4 — "self-assembly" framing + one honest sibling table). |
| #9 Vento spark components | Phase 0 + Phase 1–3 | code-tabs, shell-switcher, callouts — already P0 in `04`. |
| #10 Side-by-side zero-codegen autocomplete proof | Phase 2 (build-a-service) + Phase 3 (Contracts concept) | The contract→client type-flow proof; static side-by-side blocks (GIFs are wave-2, see gaps). |

## 5. Competitor exemplars → page assignments (authoring north stars)

Each authored page gets a named competitor exemplar to benchmark against (research competitor
teardowns under `research/competitors/`). This feeds the Stage-5 IMPL-EVAL benchmark.

| Page / lane | Exemplar(s) | What to borrow |
| ----------- | ----------- | -------------- |
| Landing | Astro, Encore | outcome hero, scaffold-flow visualization (Encore TS→infra), warm tone |
| Why NetScript | TanStack motivation page | the single most persuasive page; problem→answer→proof |
| Quickstart / Tutorials | Astro tutorial track, Laravel Sail quickstart | guaranteed-success sequential ladder, output blocks |
| Capability hubs | Medusa Commerce Modules, Astro features | one-screen concept + headline API + Diátaxis router card |
| Reference (KEEP) | TanStack API tables | already generated; do not re-author (`06`) |
| Concept pages | Temporal (durability theory), NestJS (lifecycle) | replay/non-determinism rigor for sagas; module/lifecycle clarity |
| Code samples | Hono recipes, tRPC autocomplete panels | zero-fat runnable snippets; side-by-side type-flow proof |
| Components/engine | Lume's own docs, Vento docs | nav/toc/search patterns, include-based widgets |

## 6. Continuation gaps (explicitly deferred — do not silently drop)

Carried from `00-research-summary.md §3`; out of scope for the first authoring waves, recorded so the
PLAN-EVAL and final eval see them as known, not missing:

1. **Auto-generated TypeDoc-style parameter tables** during Lume compile — the Reference lane already
   covers exhaustive API via the generated units (`06`); a Lume-native param-table engine is a wave-2
   enhancement, not a gap in coverage.
2. **Visual flowchart SVGs** (Saga compensation lifecycle, parallel-queue fan-out) — Medusa-grade
   diagrams; wave-2 asset work.
3. **Multi-framework front-end integrations** (Svelte/Solid/Vanilla beyond Fresh 2 + React) — wave-2
   SDK tutorial expansion.

## 7. Stage-2 exit → Stage-3 handoff

Deliverables produced this stage: this doc (`09`) + the authoring brief set under `_plan/briefs/`
(`00-INDEX.md` + `phase-1-front-door.md`). PLAN-EVAL (Minimax-M3, separate OpenHands session) should
challenge: (a) the five engine decision points §3, (b) whether the §5 exemplar assignments raise the
bar enough vs. each named competitor, (c) any locked decision the research suggests revisiting, and
(d) the phase sequencing under the added engine work. In-run plan refinements are authorized.
