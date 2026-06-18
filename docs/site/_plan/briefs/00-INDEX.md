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

1. Every NetScript API/adapter/signature shown is verified against `deno doc <module>` + the unit's
   `mod.ts`/README (`09 §2c`). No invented APIs.
2. Code samples are runnable, JSR-import-realistic, error-path-aware where relevant (`03` global
   rules).
3. Tone/positioning ladders up to `01`; no internal jargon on marketing surfaces; honors all `08`
   locked decisions.
4. Cross-links to Reference for full signatures; never reproduces generated API tables by hand.
5. The page's named competitor exemplar bar (`09 §5`) is visibly met or exceeded.
6. Chrome intact: pagefind, base_path, anchors, theme tokens (`--ns-*`).

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
- GUARDRAILS: docs lane only; flag any source-blocker to Codex; do not touch Reference lane.
```

## Dispatch table — all pages by phase

Phase order follows `05`. Components (Phase 0) and engine decisions (`09 §3`) are prerequisites for
the marketing/hub `.vto` pages; prose Markdown pages can begin in parallel.

### Phase 0 — Foundations (engine + components) · prerequisite
| Item | Type | Lane | Notes |
| ---- | ---- | ---- | ----- |
| `_components/` P0 set: callout, tabbedCode, hero, card+featureGrid | NEW | Opus low + Codex if any `_config.ts` shim | `04` component table; token-styled on `--ns-*`. tabbedCode ships vanilla `script.js` (no islands). |
| `_data.ts navSections` ladder + per-group subtitles | REWRITE | Opus low | `02` target nav tree. Plain-English labels (`08` Q14). |
| markdown-it GitHub-callout shim in `_config.ts` | NEW | Codex (config = repo tooling, not prose) | `04`; renders `> [!NOTE]` → `comp.callout`. |
| Engine decisions D-E2 Shiki / D-E3 toc / D-E4 sitemap | NEW | Codex slice (config) **after PLAN-EVAL adjudicates `09 §3`** | not authored prose; `_config.ts` + base layout. |
| `comp.breadcrumb` + `comp.nextPrev` in base layout | NEW | Opus low | `02` learning-curve devices. |

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
9 hubs (`03 §10` shape) + 4 concepts (`03 §9`). One hub per `deno doc` unit cluster:
| Hub | Units |
| --- | ----- |
| Services & contracts | service, contracts, sdk |
| Background jobs (workers) | plugin-workers-core, plugin |
| Durable sagas | plugin-sagas-core |
| Triggers & ingress | plugin-triggers-core |
| Durable streams | plugin-streams-core |
| Data: database & Prisma | database, prisma-adapter-mysql |
| KV, queues & cron | kv, queue, cron |
| Telemetry & logging | telemetry, logger |
| Fresh UI & design system | fresh-ui, fresh |
| Concepts: Contracts & type-flow / Durable workflows / Observability / Aspire | contracts+sdk / sagas-core / telemetry / aspire, config, runtime-config |

> Coverage check vs `09 §2a`: the hub clusters above touch all 21 packages + 4 plugins except
> `watchers` (internal/dev-tooling — fold a one-line mention into the relevant concept or omit from
> the public hubs; flag for PLAN-EVAL whether `watchers` warrants public surface).

### Phase 4 — How-to + Resources · Opus low/medium
6–7 recipes (`03 §11` goal-first shape): add-a-service, add-database+migration, wire queue/kv/cron,
add-OTel, customize-UI (`ui:init`/`ui:add`), deploy; + glossary (`03 §12`, Opus low) + curated CLI
reference (wave 2).

### Phase 5 — Polish / wave 2 · optional
Tutorial 5 (webhook), "author your own plugin" advanced guide, changelog, cross-link + a11y + OG/meta
pass (Sonnet for mechanical link/meta work), continuation-gap assets (`09 §6`).

## Sequencing for the Stage-4 workflow

1. Phase 0 components/nav must land first (every `.vto` page depends on `comp.*`). Engine decisions
   D-E2/3/4 land as a Codex config slice once PLAN-EVAL adjudicates `09 §3` — they do not block
   Markdown prose pages.
2. Phase 1 front-door next (highest ROI; the worst current offender is the bare landing).
3. Tutorials before hubs (hubs' Diátaxis-router cards link into tutorials).
4. How-to last of the substantive lanes (recipes assume concepts/tutorials exist to link).
5. The workflow may fan out prose Markdown pages (tutorials, concepts, how-tos) in parallel with the
   Phase-0 component build, since they don't call `comp.*` directly (Markdown + callout shim).
