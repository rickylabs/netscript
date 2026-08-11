# Context Pack: NetScript DevTools Contribution Architecture RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Worktree | `/home/codex/repos/ns-rfc-devtools-contribution` |
| Current phase | `plan-eval` — **ESCALATED after two FAIL_PLAN cycles** (harness limit reached) |
| Draft PR | [#1450](https://github.com/rickylabs/netscript/pull/1450) — draft, `status:research`, `Backlog / Triage` |
| Archetype | Described, not built |
| Scope overlays | `docs` + `frontend` |
| Baseline | `2256a67bf` (`origin/main`, verified 2026-08-11) |

## Current State

**Stages A–G complete; the run is STOPPED at the escalation boundary.** RFC-0002 is committed, the
plan is locked, 25 filing drafts exist, and PLAN-EVAL ran twice. Both cycles returned `FAIL_PLAN`.
The harness allows two before escalation, so the run does **not** open a third cycle.

Every **supervisor-fixable** finding from both cycles is fixed and verified. What remains is
**owner-gated only**: the unlaunchable GLM design pass (D-10), fork F-1 (package/spine ownership),
and fork F-3 (manifest schema evolution). No board mutation has occurred; PR #1450 is still draft.

**Nothing is locked yet.** `plan.md` carries the twelve charter questions as an open-decision docket;
`research.md` carries the evidence-input register (E1–E7) with every entry `pending`.

## Completed

- **Stage A — done.** Charter read in full; harness contracts read (`activation.md`, `run-loop.md`,
  `lane-policy.md`, `seed-run.md`, `gates/plan-gate.md`); baseline verified against live `origin/main`;
  `supervisor.md` written first; run artifacts scaffolded; drift D-1/D-2/D-3 pre-registered;
  bootstrap commit `ccc4c0a70` pushed; draft PR **#1450** opened against `main` with the docs-only CI
  lane + RFC/status taxonomy + `Backlog / Triage` milestone; opening phase comment posted with the
  charter read-back.

## In Progress

- Stage B — discovery corpus across evidence inputs E1–E7, every claim cited.

## Next Steps

1. Stage B — discovery corpus across E1–E7, every claim cited; commit any Tier-C `workflow.js`
   **before** it executes.
2. Stage C — synthesis into `research.md`; name the stage-D deep-dive topics.
3. Stage D / D2 — design packs (Fable 5 · medium) + the mandatory GLM 5.2 · xhigh design pass.
4. Stage E — canonical RFC + plan lock; all twelve questions resolved or escalated as numbered forks.
5. Stage F — unoriented adversarial review on a distinct model; triage + fixes.
6. Stage G — formal Codex GPT-5.6 Sol high PLAN-EVAL, separate daemon-attached session, against an
   immutable commit. **Hard stop until `PASS`.**
7. Stage H-prep — supersession map, filing manifest, agent briefs, owner decision brief. **Stop for
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
