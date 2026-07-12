# Research — feat-dashboard-design-prototype--design

Four parallel research lanes ran 2026-07-06 (seed-run corpus mining, GitHub board sweep, fresh-ui
surface inventory, eis-chat prior art + Claude Design capability research). Findings below are the
load-bearing subset; each cites its source.

## Re-baseline

- Carried-in source: `.llm/runs/plan-roadmap-expansion--seed/` (the ratified roadmap-expansion seed
  run) + the filed beta.6 board (#399/#400 + DDX/T issues).
- Re-derived against `main` @ `317e4b50` (2026-07-06, beta.5 cut).
- What changed vs the carried-in version:
  - The seed run planned DDX-15 as "Claude design-sync artifact + panel prototype" **depending on
    DDX-0**; owner (2026-07-06, this session) expanded the scope to a **full E2E Claude Design
    prototype** and inverted the edge (prototype pass 1 validates the DDX-0 promote-set).
  - fresh-ui at planning time vs now: version marched `0.0.1-alpha.6` → `beta.4`; the seed-run
    inventory (`analysis/A-dashboard/01`) remains directionally correct but the AI/chat collection,
    `DataGrid`, `Icon`, and the DTCG token pipeline all landed after it.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The dashboard epic is **#400** (beta.6, 23 slices DDX-0…19); design lane is **#425 (DDX-15)**: `plugins/dashboard/.design-sync/` + Fresh panel-shell prototype, depends on DDX-0, blocks DDX-5 + all panels. It does NOT cover a full E2E canvas prototype. | `gh issue view 400 / 425 --repo rickylabs/netscript` (WSL) |
| 2 | Design research is already done: competitor teardowns with distilled IA vocabulary (Encore Flow/API Explorer, Temporal event-history All/Compact/JSON, Inngest two-panel + rerun-from-step, Trigger.dev OTel inspector; Appwrite create→configure→monitor, Directus Panel contract, Strapi codegen-from-UI). | `.llm/runs/plan-roadmap-expansion--seed/research/A-dashboard/03-competitor-dev-console-teardown.md`, `04-baas-admin-console-teardown.md` |
| 3 | The locked panel IA (7 cross-cutting panels + per-capability sections) and the full design proposal exist. | `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md` §0–9 |
| 4 | **NS One (eis-chat DS) L0–L2 is byte-identical to fresh-ui's copy-source output** — NS One *is* fresh-ui output; the ratified gap is the missing L3 `blocks/` layer (DDX-0 promote-set: breadcrumbs, context-rail, plugin-gated-view, activity-feed, connector, entity-rail, tree-nav). | `.llm/runs/plan-roadmap-expansion--seed/analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md` |
| 5 | fresh-ui today: ~55–60 units (31 registry components, 11 blocks, 3 islands, 8 runtime compounds, L0 primitives), 4-tier DTCG token pipeline (`tokens/*.tokens.json` → `tokens.css` → Tailwind v4 bridge), machine-consumable registry (`registry.generated.ts` 290KB embeds all source; structured `@component/@layer/@depends` JSDoc). | `packages/fresh-ui/{deno.json,registry.manifest.ts,registry.generated.ts,tokens/}` |
| 6 | **Near-total divergence, not drift**: all current fresh-ui architecture (src/ restructure, token pipeline, AI/chat collection, DataGrid, Icon) landed 2026-06-14 → 07-05. The ~6-month-old Claude Design project predates all of it — patching is not viable. | `git log --oneline -- packages/fresh-ui` (50 commits, earliest 2026-06-14) |
| 7 | Styling is class/CSS-driven: `--ns-*` vars + semantic `ns-*` classes + layout objects (~25KB hand-authored CSS) port to React **verbatim**; only JSX/hooks (Preact signals, Fresh islands, `f-client-nav`, native `<dialog>`) need conversion. | `packages/fresh-ui/registry/{theme/tokens.css,styles/layouts.css}`; `src/runtime/*` |
| 8 | The React-port recipe is **written**: eis-chat `.design-sync/NOTES.md` — synthetic npm package, **type-only Preact imports compile as genuine React under React JSX**, CSS must be the compiled Tailwind closure (~80KB `_fresh` output, NOT a hand-flattened subset), fonts via Google-Fonts `@import`. | eis-chat `resources/design/` + `.design-sync/` (private repo, WSL `gh`); extraction: seed run `analysis/A-dashboard/02-eis-chat-design-sync-full-extraction.md` |
| 9 | Six recorded parity traps: (a) canvas defaults to no theme → append `:root:not([data-theme])` block; (b) missing spacing tokens silently zero gaps; (c) prototype found a real source bug (DataTable grid-template collapse); (d) weak synthetic `.d.ts` → conventions.md is the prop-contract source; (e) `[RENDER_BLANK]` unauthored previews; (f) raw-hex leakage → mandate token-driven charts. | eis-chat `.design-sync/NOTES.md`; seed run `analysis/A-dashboard/02` |
| 10 | Claude Design (July 2026): design-system import is first-class (GitHub repo / files / `/design-sync` from Claude Code); canvas runtime is React; MCP server `https://api.anthropic.com/v1/design/mcp` enables agent-driven import/export; known 404/401 flakiness (anthropics/claude-code #69310/#69313/#69324/#69325); usage draws from the shared plan pool; exports incl. Claude Code handoff bundle. | https://support.claude.com/en/articles/14604397 · https://support.claude.com/en/articles/14604416 · claude-code issues above |
| 11 | eis-chat prototype = the proven template: brief + inspiration shots + DS import → 6 screens × light/dark + shell details (22 prototype-shots) → `NS-ONE-ADDITIONS.md` sync-back spec (181 CSS selectors / 51 `ns-*` bases) → stacked implementation PRs. Loop was **two-pass**: discovery pass → author components at source → re-sync → refine on real components. | eis-chat `resources/design/{CLAUDE-DESIGN-BRIEF.md,PROPOSED-COMPONENTS.md,NS-ONE-ADDITIONS.md,prototype-shots/}` |
| 12 | Voice/brand constraints binding on dashboard copy: dark-default with "warm cream light theme" brand look; factual comparison tone; **no "honesty/candor" framing**; no unshipped-capability claims; no invented metrics. | seed run `specs/01-ratified-decisions.md:40-48`; `analysis/D-positioning/current-docs-audit.md` §4–5 |
| 13 | Compiled-CSS-closure source: `apps/dashboard` (the scaffolded showcase app) is the natural Fresh build from which to compile the Tailwind closure for the synthetic package. | `apps/dashboard/` (referenced as the worked showcase in `docs/site/capabilities/fresh-ui.md`) |
| 14 | Beta.6 board context: 41 open issues; telemetry T3–T8 co-land with dashboard DDX; #505 is the only `status:impl` item (beta.5 e2e-cli-prod red). This run must not collide with that supervisor's lanes. | GitHub milestone `0.0.1-beta.6` sweep, 2026-07-06 |

## jsr-audit surface scan (package/plugin waves)

N/A — this run ships repo tooling (`tools/design-sync/`) + design artifacts; no `packages/` or
`plugins/` surface changes. The fresh-ui implementation of prototyped components is downstream
(WSL Codex lanes fed by the sync-back spec) and will carry its own jsr-audit there.

## Open questions

- OQ-1 (**must resolve at slice 0**): does the Claude Design MCP round-trip work from this
  environment (create/read/export), given the known 404/401 reports? Fallback recorded in
  `supervisor.md` if not.
- OQ-2 (safe to defer to slice 1): synthetic package naming — DDX-15 spec says
  `@netscript/dashboard-ns-one` / global `NSOne`; since this sync covers all of fresh-ui (not a
  dashboard subset), `@netscript/ns-one` may be truer. Decide when writing `config.json`.
- OQ-3 (safe to defer to slice 7): where prototype-shots live long-term (repo size vs
  `resources/design/dashboard/prototype-shots/` following eis-chat). Default: commit them.
- OQ-4 (safe to defer): whether the compiled CSS closure builds from `apps/dashboard` as-is or
  needs a dedicated kitchen-sink page to pull all registry classes into the closure.
