# Authoring Brief Index — Stage 4 dispatch map

This is the **dispatch layer** between the plan (`00`–`09`) and the Stage-4 authoring workflow. It
maps every page to: its Diátaxis mode, the build phase (`05`), the page outline (`03`), the source
units to `deno doc`, the research findings (`09 §4`) and competitor exemplar (`09 §5`) to apply, the
locked decisions (`08`), the authoring lane (model/effort per LD-DOCS-LANE), and an acceptance bar.

> The Stage-4 workflow dispatches **one agent per page** (or per tight cluster), each handed: this row
> + the linked `03` outline + `01` positioning + `08` locked decisions + the named research files.
> Each agent commits its page(s) and appends `commits.md`.

## LD-DOCS-LANE routing (from `CLAUDE.md` documentation-authoring exception, 2026-06-18)

- **Opus medium** — reference/concept prose, the "why" page, capability hubs (language-dominated,
  highest-judgment pages).
- **Opus low** — mechanical README-style standardization, zone-index re-skins, glossary.
- **Sonnet 4.6** — trivial link-fix/cleanup passes.
- Authoring agents run **under the harness** (`netscript-harness` + `deno-fresh` + `jsr-audit` where
  the page touches published-surface examples). Output respects doctrine, the publish surface, gates.
- **Validation stays with OpenHands** (Stage 5 IMPL-EVAL, Minimax-M3; Stage 7 final, Qwen-3.7-max) —
  the Claude workflow is the **generator only**; it never self-certifies.
- **Any framework-source change** (e.g. a `*Namespace` type export needed for a sample to compile)
  is a **WSL Codex** daemon-attached slice, NOT the authoring workflow. Authors who hit a
  source-blocker stop and flag it; they do not edit `packages/`/`plugins/`.

## Global acceptance bar (every page)

1. **Accuracy gate (enforced, not policy — resolves PLAN-EVAL B2).** Every NetScript
   API/adapter/provider/signature shown is verified against `deno doc <module>` + the unit's
   `mod.ts`/README (`09 §2c`). No invented APIs. Enforcement is two-tier:
   - **Target (Phase 0b tooling slice, Codex):** `.llm/tools/docs/api-cite.ts` — extracts every
     `import { … } from "@netscript/…"` (and referenced symbols) from each authored page's fenced
     code blocks, runs `deno doc --json` against each module, and **fails the PR** if any imported
     symbol is unknown. Wired into `archetype-gate-matrix.md` as a `docs-content-gate` (or appended
     to the docs lane gate set). This is the gold standard.
   - **Floor (mandatory from page 1, even before the gate script lands):** each dispatched page
     gets a worklog at `docs/site/_plan/worklog/<page>.md` recording, per code proof, the exact
     `deno doc <module> --filter <symbol>` command, its output (or a stable hash), and the commit
     sha of the inventory source (`09 §2a`). No page merges without its worklog row. A reviewer or
     `api-cite.ts` can then spot-check/confirm. "Verify via `deno doc`" without an artifact is not a
     guardrail.
2. **At least one annotated, runnable, JSR-import-realistic code proof per hub/landing/why page**
   (8–12 lines, lifted verbatim from a `deno doc`-verified README/export, placed in
   `comp.tabbedCode` with a one-line "this replaced `X` boilerplate" annotation). Prose bullets like
   "use `createWatcher` to watch files" do NOT satisfy this — there must be a working code path that
   proves the capability. This is the single bar-raiser that lifts the docs from "matches" to
   "beats" the named exemplars and is exactly what the B2 gate checks.
3. Code samples are runnable, JSR-import-realistic, error-path-aware where relevant (`03` global
   rules).
4. Tone/positioning ladders up to `01`; no internal jargon on marketing surfaces; honors all `08`
   locked decisions.
5. Cross-links to Reference for full signatures; never reproduces generated API tables by hand.
6. The page's named competitor exemplar bar (`09 §5`) is visibly met or exceeded.
7. Chrome intact: pagefind, base_path, anchors, theme tokens (`--ns-*`).
8. **Aspire framing precision (resolves PLAN-EVAL R5):** every "Aspire" mention must use the precise
   framing — `@netscript/aspire` is a **TypeScript AppHost inspection/diagnostics** package
   (`inspectAspire`, TS AppHost generation), **not** the .NET Aspire polyglot orchestrator runtime.
   Author-time sniff test: "would a platform engineer confuse this with .NET Aspire the orchestrator?"
   The "Aspire as USP + `--no-aspire`" framing is correct (the CLI flag is real/verified); the hero
   copy must not overclaim orchestration.

## Brief template (each per-page brief expands this)

```
### <page path> — <NEW | REWRITE | RE-HOME> · <Diátaxis mode> · <phase> · <lane>
- GOAL: one sentence — what the reader can do/understand after.
- AUDIENCE: persona (01) + their entry state.
- OUTLINE: link to 03 §N (structure, component placement, sample strategy).
- SOURCE UNITS (deno doc): <@netscript/... modules + README quick-examples to lift from>.
- APPLY FINDINGS: <09 §4 finding ids> · EXEMPLAR: <09 §5>.
- LOCKED DECISIONS: <08 Qn ids that constrain this page>.
- COMPONENTS: <comp.* used> (04).
- ACCEPTANCE: page-specific bar beyond the global bar.
- WORKLOG (mandatory, B2 floor): write `docs/site/_plan/worklog/<page>.md` with one row per code
  proof — `deno doc <module> --filter <symbol>` command, output/hash, and `09 §2a` inventory sha.
  Page does not merge without it.
- GUARDRAILS: docs lane only; flag any source-blocker to Codex; do not touch Reference lane.
```

## Dispatch table — all pages by phase

Phase order follows `05`. **Phase 0a** (components + nav chrome) is the prerequisite for the
marketing/hub `.vto` pages; **Phase 0b** (engine config) lands separately and does not block prose.
Prose Markdown pages can begin against 0a in parallel.

### Phase 0 — Foundations · prerequisite (split into 0a / 0b — resolves PLAN-EVAL B3)

Phase 0 is split so the chrome ships independently of engine config and Phase-1 prose is never
wedged behind the whole bundle. **Phase 0a is shippable to Pages as a chrome-only preview**; Phase 1
prose Markdown can begin against 0a in parallel. Phase 0b (engine/config) lands separately and does
not block prose.

#### Phase 0a — Component + nav chrome (shippable preview)
| Item | Type | Lane | Notes |
| ---- | ---- | ---- | ----- |
| `_components/` P0 set: callout, tabbedCode, hero, card+featureGrid | NEW | Opus low + Codex if any `_config.ts` shim | `04` component table; token-styled on `--ns-*`. tabbedCode ships vanilla `script.js` (no islands). |
| `_data.ts navSections` ladder + per-group subtitles | REWRITE | Opus low | `02` target nav tree. Plain-English labels (`08` Q14). |
| `comp.breadcrumb` + `comp.nextPrev` in base layout | NEW | Opus low | `02` learning-curve devices. |
| **Acceptance 0a:** site builds + deploys to Pages with the new chrome (no engine config), pagefind/base_path/`--ns-*` intact. | | | This is the merge gate for 0a. |

#### Phase 0b — Engine config (Codex slice; does NOT block prose)
| Item | Type | Lane | Notes / acceptance |
| ---- | ---- | ---- | ------------------ |
| markdown-it GitHub-callout shim in `_config.ts` | NEW | Codex (config = repo tooling, not prose) | `04`; renders `> [!NOTE]` → `comp.callout`. |
| D-E2 **Shiki** adopt | NEW | Codex slice (config) | **Acceptance line (resolves D-E2 condition):** before locking, verify Shiki composes with pagefind + `base_path` + anti-flash theme tokens. If it breaks the chrome, Prism fallback is acceptable — but the compatibility check is a slice acceptance criterion, not prose. |
| D-E3 **toc** plugin | NEW | Codex slice (config) | Pure additive; low risk. |
| D-E4 **sitemap** plugin | NEW | Codex slice (config) | **Acceptance:** confirm emitted URLs honor `base_path` (`rickylabs.github.io/netscript`). |
| `.llm/tools/docs/api-cite.ts` accuracy gate (B2 target) | NEW | Codex (repo tooling) | See Global acceptance bar #1; wire into `archetype-gate-matrix.md` docs lane. |

> D-E5 (auto-cards from `search.ts`) is **deferred** to wave 2 (`09 §3`); `comp.featureGrid`/`comp.card`
> cover Phase 1–3 manually. Engine decisions are adjudicated by PLAN-EVAL (`09 §3`, §8): 4-of-5 adopt,
> D-E2 conditioned on the acceptance line above, D-E5 deferred.

### Phase 1 — Front door (detailed briefs in `phase-1-front-door.md`)
| Page | Type | Mode | Lane | Exemplar |
| ---- | ---- | ---- | ---- | -------- |
| `index` (landing) | REWRITE→`.vto` | Tutorial-entry | **Opus medium** | Astro, Encore |
| `why` | NEW `.vto` | Explanation | **Opus medium** | TanStack motivation |
| `quickstart` | REWRITE | Tutorial | Opus medium | Astro/Laravel Sail |
| re-home `architecture.md` + `plugin-model.md` → Core concepts | RE-HOME | Explanation | Opus low (gloss only) | — |

### Phase 2 — Learning track (Tutorials) · Opus medium
| Page | Source units (deno doc) | Findings/Exemplar |
| ---- | ----------------------- | ----------------- |
| `tutorials/first-workspace` (expand getting-started) | scaffold pipeline phases; CLI | Astro tutorial track |
| `tutorials/build-a-service` | contracts, service, sdk, fresh | #10 type-flow proof; tRPC panels |
| `tutorials/background-jobs` | plugin-workers-core, plugin (registry) | telemetry trace observation |
| `tutorials/durable-workflow` | plugin-sagas-core | Temporal durability framing |
| `tutorials/webhook` (wave 2) | plugin-triggers-core, plugin-workers-core | composed end-to-end |
| `tutorials/index` re-skin | — | learning-path card |

### Phase 3 — Capability hubs + remaining concepts · Opus medium
10 hubs (`03 §10` shape) + 4 concepts (`03 §9`). One hub per `deno doc` unit cluster:
| Hub | Units |
| --- | ----- |
| Services & contracts | service, contracts, sdk |
| Background jobs (workers) | plugin-workers-core, plugin |
| Durable sagas | plugin-sagas-core |
| Triggers & ingress | plugin-triggers-core |
| Durable streams | plugin-streams-core |
| Data: database & Prisma | database, prisma-adapter-mysql |
| KV, queues & cron | kv, queue, cron |
| File watching & ingestion | watchers |
| Telemetry & logging | telemetry, logger |
| Fresh UI & design system | fresh-ui, fresh |
| Concepts: Contracts & type-flow / Durable workflows / Observability / Aspire | contracts+sdk / sagas-core / telemetry / aspire, config, runtime-config |

> **Coverage check vs `09 §2a` (binding — resolves PLAN-EVAL B1):** the 10 hub clusters above touch
> **all 21 packages + 4 plugins** with no exclusions. `@netscript/watchers` is a publish-configured,
> README-instrumented, JSR-installable package with a real public surface (`createWatcher`,
> `FileWatcher`, polling/stability/stop semantics verified via `deno doc`); it is **not**
> internal/dev-tooling and now has a first-class hub ("File watching & ingestion"). The `09 §2a`
> inventory is the binding surface authority. Watchers is also the canonical worked example for the
> B2 accuracy gate (every adapter/symbol verified against `deno doc`).

### Phase 4 — How-to + Resources · Opus low/medium
6–7 recipes (`03 §11` goal-first shape): add-a-service, add-database+migration, wire queue/kv/cron,
add-OTel, customize-UI (`ui:init`/`ui:add`), deploy; + glossary (`03 §12`, Opus low) + curated CLI
reference (wave 2).

### Phase 5 — Polish / wave 2 · optional
Tutorial 5 (webhook), "author your own plugin" advanced guide, changelog, cross-link + a11y + OG/meta
pass (Sonnet for mechanical link/meta work), continuation-gap assets (`09 §6`).

## Sequencing for the Stage-4 workflow

1. **Phase 0a** components/nav must land first (every `.vto` page depends on `comp.*`); it is
   shippable to Pages as a chrome-only preview. **Phase 0b** (Shiki/toc/sitemap/callout shim +
   `api-cite.ts`) lands as a Codex config slice in parallel and does NOT block Markdown prose pages.
2. Phase 1 front-door next (highest ROI; the worst current offender is the bare landing). Front-door
   prose can begin against 0a before 0b completes.
3. Tutorials before hubs (hubs' Diátaxis-router cards link into tutorials).
4. How-to last of the substantive lanes (recipes assume concepts/tutorials exist to link).
5. The workflow may fan out prose Markdown pages (tutorials, concepts, how-tos) in parallel with the
   Phase-0a component build, since they don't call `comp.*` directly (Markdown + callout shim). Each
   such page still owes its B2 worklog (`docs/site/_plan/worklog/<page>.md`).
