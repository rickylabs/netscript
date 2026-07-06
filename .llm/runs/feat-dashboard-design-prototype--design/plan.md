# Plan: Dev Dashboard E2E Claude Design prototype + production design-sync system

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design`    |
| Branch         | `feat/dashboard-design-prototype`            |
| Phase          | `plan`                                       |
| Target         | repo tooling (`tools/design-sync/`) + design artifacts (`resources/design/dashboard/`) |
| Archetype      | N/A — no `packages/`/`plugins/` surface changes |
| Scope overlays | none (design/tooling run; SCOPE-frontend informs vocabulary only) |

## Archetype

N/A with justification: the run's code deliverable is product-facing repo tooling under `tools/`
(AGENTS.md tooling tier 2), not a workspace package. The design artifacts describe the future
`plugins/dashboard` (ARCHETYPE-5 + `plugin-dashboard-core`), but this run does not create them —
that is DDX-2/DDX-4 (WSL Codex, beta.6 supervisor).

## Current Doctrine Verdict

N/A for the tooling deliverable. The design deliverable must stay consistent with the ratified
dashboard proposal (`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md`) —
panel IA, `DashboardPanelContribution` seam vocabulary, per-capability create→configure→monitor
loops — so downstream implementation slices inherit zero design/doctrine conflicts.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| Wrap, don't reinvent | The sync system wraps fresh-ui's existing machine-consumable registry (`registry.generated.ts`, manifest, JSDoc headers) — no parallel component catalog. |
| Contract first | `config.json` + `conventions.md` are the sync contract; the converter implements them. |
| Drift is explicit | The DDX-0↔DDX-15 inversion and the #425 supersession are recorded in `drift.md` and on the board. |

## Goal

A complete, fully-agentic E2E Claude Design prototype of the NetScript Dev Dashboard (shell + 7
panels + 4 per-capability sections, light/dark) on a **new** Claude Design project seeded at 100%
component parity from today's fresh-ui — plus a **production-grade, reusable design-sync system**
(`tools/design-sync/`) and a sync-back spec that makes every new/changed component
implementation-ready for fresh-ui.

## Scope

- `tools/design-sync/` — registry→synthetic-React-package converter + compiled CSS closure +
  conventions header + preview cards; idempotent re-sync; the six eis-chat traps encoded as checks;
  `deno task design:sync` entry.
- `resources/design/dashboard/` — CLAUDE-DESIGN-BRIEF.md, PROPOSED-COMPONENTS.md (DDX-0 promote-set
  + new components in NS One idiom), NS-ONE-ADDITIONS-equivalent sync-back spec, prototype-shots/,
  DECISIONS.md.
- New Claude Design project (cloud) seeded via the sync system + brief.
- Board: file the new issue (Backlog / Triage, `Part of #400`); supersession-in-execution comments
  on #425 and #400.

## Non-Scope

- **No `packages/` or `plugins/` source changes.** fresh-ui implementation of prototyped components
  = downstream WSL Codex lanes fed by the sync-back spec (DDX-0 amendment + new issues as needed).
- No `plugins/dashboard/.design-sync/` placement yet — the plugin doesn't exist until DDX-2/4; this
  run's artifacts live in `resources/design/dashboard/` and migrate when the plugin lands (handoff
  note).
- No CLI `ui:design-sync` command — filed separately as a future framework issue (owner: the sync
  mechanism may later be offered to NetScript devs for their own Claude-Design-designed projects).
- No telemetry/AI/beta.6 implementation work — that supervisor runs elsewhere.

## Hidden Scope

- Compiled Tailwind CSS closure needs a real Fresh build; may require a kitchen-sink page so the
  closure contains every registry class (OQ-4).
- Token-closure completeness check (trap b) needs the DTCG source as ground truth — compare
  `tokens.css` var set vs compiled closure var set.
- Preview cards for ~55–60 units is authored content, not just codegen — budget agent time; carry
  eis-chat's 29 as prior art where components overlap.
- Board comments must respect netscript-pr taxonomy; new issue takes `Part of #400`, **no closing
  keyword anywhere** (umbrella discipline).

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | Full E2E prototype breadth (shell + 7 panels + 4 capability sections, light/dark), staged in two passes | Owner fork 1 (2026-07-06); showcase + decision-locking is the point; pass 1 gates the promote-set before capability sections burn canvas turns |
| LD-2 | New Claude Design project synced from today's fresh-ui at 100% fidelity/parity; stale project abandoned | Owner fork 2; evidence: near-total divergence (research F6) |
| LD-3 | Fully agentic canvas lane via Claude Design MCP; owner steers/iterates from the canvas UI; recorded fallback = owner relays if endpoint persistently 404s | Owner fork 3; flakiness gate at slice 0 |
| LD-4 | Sync system = `tools/design-sync/`, production-grade, idempotent; future promotion path = `netscript ui:design-sync` CLI feature for NetScript devs (separate issue, framework lane) | Owner fork 4 + follow-up note |
| LD-5 | Run fully decoupled from beta.6 supervisor; #425 superseded-in-execution (stays open as beta.6 tracking point, closed by this run's PR when artifacts land); new issue filed in Backlog / Triage | Owner fork 5 |
| LD-6 | Two-pass loop inverts DDX-0→DDX-15: prototype pass 1 validates/amends the DDX-0 promote-set before DDX-0 implementation | eis-chat proven loop (research F11); recorded as drift vs filed DAG |
| LD-7 | Design artifacts follow the eis-chat idiom (brief → proposed-components → prototype-shots → sync-back spec) with the six traps encoded as tooling checks | research F8/F9 |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| MCP round-trip viability (OQ-1) | **must resolve now** (slice 0 gate, before slice 3) | Fallback recorded in supervisor.md; does not block slices 1–2 |
| Synthetic package name (OQ-2) | safe to defer | Default `@netscript/ns-one`, global `NSOne`; decide at `config.json` authoring |
| Prototype-shots in-repo (OQ-3) | safe to defer | Default: commit under `resources/design/dashboard/prototype-shots/` |
| CSS-closure build source (OQ-4) | safe to defer | Default `apps/dashboard` build; add kitchen-sink page if closure is incomplete |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Claude Design MCP 404/401 flakiness | Slice 0 hard gate + recorded owner-relay fallback; retry with `/design-login` re-auth |
| Plan-token burn (canvas shares the plan pool) | Brief front-loads everything (system, IA, conventions, inspiration); batch canvas turns; owner steers interactively rather than agent trial-and-error |
| Registry→React conversion edge cases (signals-heavy islands, `chat-render` parser, `f-client-nav`) | Type-only-Preact trick covers components; islands get React-shim previews; `f-client-nav` attr is inert in React — documented in conventions.md; chat-render excluded from parity set (AI collection optional for dashboard) |
| Compiled closure missing classes/tokens (traps a+b) | Tooling checks: var-set diff vs DTCG source; `:root:not([data-theme])` default block appended by the converter |
| Canvas invents off-system UI | conventions.md as readmeHeader + token rule ("no raw hex") + per-panel previews with real content (no `[RENDER_BLANK]`) |
| Prototype drifts from ratified IA | Brief embeds proposal §IA verbatim; supervisor slice review compares shots vs IA before accepting a pass |
| Collision with beta.6 supervisor | Separate branch/worktree/PR; board comments declare the dependency; no shared files except future merge of `tools/` |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| Hand-flattened CSS subset (eis-chat trap) | risk | Avoid: converter only ships compiled closure |
| Speculative seams (files to satisfy folder shape) | risk | Avoid: every tools/ file traces to the Design section |
| Self-certifying canvas output | risk | Avoid: supervisor slice review of shots vs IA + owner steering; IMPL-EVAL independent |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Sync idempotence | yes | re-run `design:sync` on unchanged registry → zero diff in output bundle |
| Parity checklist | yes | converter report: registry manifest units vs synthetic package exports vs preview cards |
| Trap checks (a–f) | yes | converter check output committed with slice 5 |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| DataTable grid-template collapse (eis-chat finding) | verify/none | Check whether fresh-ui's current `data-table` block carries the bug; if yes → downstream fix issue, not this run |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Static (tools) | `.llm/tools/run-deno-check.ts --root tools/design-sync --ext ts,tsx` (+ lint, fmt wrappers) | PASS |
| 2 | Sync self-test | `deno task design:sync -- --check` on fresh-ui registry | bundle built; parity + trap checks green |
| 3 | Canvas smoke (slice 0) | MCP create/read scratch design | round-trip OK or fallback recorded |
| 4 | Pass review (slices 4/6) | supervisor shot-vs-IA review + owner steering sign-off | decisions logged in DECISIONS.md |
| 5 | IMPL-EVAL | OpenHands qwen-3.7-max, separate session | PASS |

## Dependencies

- Claude Design MCP availability (`https://api.anthropic.com/v1/design/mcp`) + owner `/design-login`.
- fresh-ui `0.0.1-beta.4` registry surface (in-repo, baseline `317e4b50`).
- eis-chat `.design-sync/` recipe (extracted in seed run `analysis/A-dashboard/02`).
- Seed-run corpus for the brief (proposal, teardowns, voice rules).

## Drift Watch

- fresh-ui registry changes on main during the run (re-sync before pass 2 anyway).
- #425/#400 body edits by the beta.6 supervisor.
- Claude Design product changes (MCP endpoint, design-system import behavior).
