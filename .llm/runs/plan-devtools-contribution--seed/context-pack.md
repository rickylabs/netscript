# Context Pack: NetScript DevTools Contribution Architecture RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Worktree | `/home/codex/repos/ns-rfc-devtools-contribution` |
| Current phase | `bootstrap` (seed stage A) → `research` (stage B) |
| Archetype | Described, not built |
| Scope overlays | `docs` + `frontend` |
| Baseline | `2256a67bf` (`origin/main`, verified 2026-08-11) |

## Current State

Seed run **activated**. `supervisor.md` is written (Opus 5 · high, this session, Remote Control on),
the baseline is verified against live `origin/main` with no divergence, and the mandatory run
artifacts are scaffolded. The charter is committed to the branch as
`.llm/devtools-rfc-orchestrator-brief.md` so the run is reconstructible without chat history.

**Nothing is locked yet.** `plan.md` carries the twelve charter questions as an open-decision docket;
`research.md` carries the evidence-input register (E1–E7) with every entry `pending`.

## Completed

- Stage A — charter read in full; harness contracts read (`activation.md`, `run-loop.md`,
  `lane-policy.md`, `seed-run.md`, `gates/plan-gate.md`); baseline verified; `supervisor.md` written
  first; run artifacts scaffolded; drift D-1/D-2/D-3 pre-registered.

## In Progress

- Stage A — bootstrap commit, draft PR against `main`, opening phase comment with charter read-back.

## Next Steps

1. Commit the bootstrap slice; push with an explicit refspec.
2. Open the **draft** PR against `main`; apply docs-only CI labels + RFC/status taxonomy; post the
   opening phase comment (charter read-back + selected CI lane rationale).
3. Stage B — discovery corpus across E1–E7, every claim cited; commit any Tier-C `workflow.js`
   **before** it executes.
4. Stage C — synthesis into `research.md`; name the stage-D deep-dive topics.
5. Stage D / D2 — design packs (Fable 5 · medium) + the mandatory GLM 5.2 · xhigh design pass.
6. Stage E — canonical RFC + plan lock; all twelve questions resolved or escalated as numbered forks.
7. Stage F — unoriented adversarial review on a distinct model; triage + fixes.
8. Stage G — formal Codex GPT-5.6 Sol high PLAN-EVAL, separate daemon-attached session, against an
   immutable commit. **Hard stop until `PASS`.**
9. Stage H-prep — supersession map, filing manifest, agent briefs, owner decision brief. **Stop for
   owner ratification.**

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Seed run, stages A–I | `seed-run.md` | Deliverable is a board + RFC |
| PLAN-EVAL selected; IMPL-EVAL `N/A` by run shape | `run-loop.md` §4/§7, `drift.md` D-2 | Substitute assurance = PLAN-EVAL + docs gates |
| Planning-only mutation boundary | charter; `supervisor.md` | Board untouchable before owner ratification |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/plan-devtools-contribution--seed/supervisor.md` | new | Written first — run activation |
| `.llm/runs/plan-devtools-contribution--seed/research.md` | new | Re-baseline + E1–E7 evidence register |
| `.llm/runs/plan-devtools-contribution--seed/plan.md` | new | Scope + twelve-question docket |
| `.llm/runs/plan-devtools-contribution--seed/worklog.md` | new | Slice plan + gate tables |
| `.llm/runs/plan-devtools-contribution--seed/context-pack.md` | new | This file |
| `.llm/runs/plan-devtools-contribution--seed/drift.md` | new | D-1/D-2/D-3 pre-registered |
| `.llm/runs/plan-devtools-contribution--seed/phase-registry.md` | new | Stage A–I registry |
| `.llm/devtools-rfc-orchestrator-brief.md` | new | The charter, committed for reconstructibility |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static (fmt / doc:lint) | `NOT_RUN` | Stage I |
| Fitness (citation, dedup, planned-surface jsr rubric) | `NOT_RUN` | Stages B / E / H-prep |
| Runtime / Consumer | `N/A` | No source in the changeset |
| PLAN-EVAL | `NOT_RUN` | Stage G — hard stop |

## Open Questions

The twelve charter questions (`plan.md` § Open-Decision Sweep) are all open. No research-side
questions yet.

## Drift and Debt

- Drift: D-1 (GLM lane reactivated), D-2 (IMPL-EVAL N/A by run shape), D-3 (GLM transport has no
  reasoning trace) — all `minor`, all accepted.
- Debt: none created. Any doctrine violation the RFC chooses to defer lands in
  `.llm/harness/debt/arch-debt.md` at stage E, not silently in the RFC.

## Commits

See the draft PR's commit list + per-stage PR comments (V3 retired `commits.md`).
