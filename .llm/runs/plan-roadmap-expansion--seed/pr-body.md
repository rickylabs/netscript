## Roadmap Expansion — Fable 5 planning run

Steering input + harness run for the **Fable 5 roadmap supervisor** to fold five backlog features
into **Road to 0.0.1-stable** (`#301`). This PR is the **planning charter only** — it opens no
epics/issues and touches no framework code until the owner ratifies.

### The five topics
- **A — Dev Dashboard** (killer feature; ships as a **plugin** at beta.6) — `specs/topic-A-dashboard.md`
- **B — Telemetry production-grade revamp** (feeds A) — `specs/topic-B-telemetry.md`
- **C — Tutorial complete rewrites + minimal eis-chat tutorial** (beta.7 docs cut) — `specs/topic-C-tutorials.md`
- **D — Per-feature storytelling / positioning docs** (beta.7 docs cut) — `specs/topic-D-positioning-docs.md`
- **E — Deno-desktop + unified single-process deployment** (beta.8/stable; extends `#327`) — `specs/topic-E-desktop-deploy.md`

### Charter
- `specs/00-mission-and-flow.md` — **authoritative**: mission, the A→G delegation flow (Fable →
  Sonnet-5 deep-search workflow → Opus-4.8 deep-dive agents → WSL Codex adversarial → OpenHands
  PLAN-EVAL), the B1–B4 output contract, the overnight-system + memory directive, hard boundaries.
- `specs/01-ratified-decisions.md` — milestone train, owner decisions D1–D4, R1/R4, positioning
  lock, delegated calls (D-NSONE, telemetry flow).
- `specs/02-eis-chat-reference.md` — eis-chat as the working reference; per-topic reading map.
- `FABLE-PROMPT.md` — the thin launch prompt + PR-discipline mandate.

Each `topic-*` spec opens with the **owner's original bullets preserved verbatim**, then the agreed
decisions, eis-chat pointers, delegated calls, dependencies, "what B researches", "what Fable
produces".

### Status
- [x] Harness run scaffolded (`.llm/runs/plan-roadmap-expansion--seed/`) + specs seeded
- [x] **A** — Supervisor online: charter + specs read; worklog + phase registry committed
- [x] **B** — Sonnet-5 deep-search corpus (5 concurrent agents; 75 files across 20 topic/folder cells; eis-chat reference staged)
- [x] **C** — Fable synthesis + both delegated decisions resolved with byte-evidence (`analysis/FABLE-STAGE-C-SYNTHESIS.md`) — **D-NSONE** = promote the missing fresh-ui L3 `blocks/` layer; **grouped-trace flow** = two-tier (beta.6 Flow-B framework-native / stable Flow-A duckdb)
- [x] **D** — 4 Opus-4.8 deep-dive design proposals (`design/{A-dashboard,B-telemetry,E-desktop,CD-docs}/`): telemetry T1–T9, dashboard DDX-0…19, docs S0+C1–6+D1–9+V, desktop #E1–E8
- [x] **D+** — Owner-expanded Topic-A source set folded (see note below)
- [x] **E (locked design)** — `research.md` (Plan-Gate checklist + 14-row Findings + jsr-audit surface scan), `plan.md` (12 locked decisions, 13-fork open-decision sweep, cross-epic DAG, milestone train, risk register, per-epic gate matrix), worklog `## Design`
- [ ] **F1/F2** — WSL Codex adversarial review + fixes
- [ ] **G** — OpenHands PLAN-EVAL (minimax M3, separate session) — must PASS
- [ ] Owner ratification → milestones created + forks picked → epics/rescopes filed

> **Owner expanded the Topic-A source set (mid-run, 2026-07-04).** At the owner's direction the
> dashboard competitor corpus was extended beyond dev-consoles to the "manage framework features
> **through the UI**" category: **Appwrite Console** (north-star), **Directus** (extensibility /
> plugin-panel model), **Strapi** (codegen-from-UI mirroring the CLI + in-dashboard AI). Teardown at
> `research/A-dashboard/04-baas-admin-console-teardown.md` + 17 new matrix rows. This sharpened the
> Topic-A IA (flat "Plugin Control list" → cross-cutting panels + per-capability
> create→configure→monitor sections), added **DDX-17** (`DashboardPanelContribution` seam /
> `.withDashboardPanel`), **DDX-18a-d** (per-capability sections), **DDX-19** (codegen-from-UI), and
> reframed **D-NSONE** via the Directus panel-contribution precedent. New owner forks OF-10…OF-13.

**Draft** until the roadmap is complete and PLAN-EVAL passes; the owner ratifies and cuts. Fable
pushes + updates this PR after every stage.

Refs #301

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_012wKHquACkXnWPDgJYhhFjN
