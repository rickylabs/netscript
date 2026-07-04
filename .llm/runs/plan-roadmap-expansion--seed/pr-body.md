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
- [ ] B — Sonnet-5 deep-search corpus (`matrix/ analysis/ research/ context/`, per-topic)
- [ ] Fable analysis + Opus-4.8 per-topic design proposals
- [ ] Locked design (`research.md` / `plan.md` / `## Design`)
- [ ] WSL Codex adversarial review + fixes
- [ ] OpenHands PLAN-EVAL (separate session)
- [ ] Owner ratification → epics/rescopes filed

**Draft** until the roadmap is complete and PLAN-EVAL passes; the owner ratifies and cuts. Fable
pushes + updates this PR after every stage.

Refs #301

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_012wKHquACkXnWPDgJYhhFjN
