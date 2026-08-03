# Supervisor — NetScript 0.0.5 release orchestration

| Field | Value |
| --- | --- |
| Run id | `release-0.0.5--orchestration` |
| Supervisor model | Claude Fable 5 · low (orchestrator lane, `planning_decisions`) |
| Host | WSL2 Linux 6.18.33.2, `/home/codex/repos/ns-005` |
| Branch | `orchestrator/0.0.5` |
| Baseline | `33ca579ad` — `chore(release): cut 0.0.4 (#1159)` |
| Milestone | `0.0.5` — 44 open issues at run start |
| Started | 2026-08-03 |
| Profile | `.llm/harness/workflow/milestone-run.md` (first real execution) |
| Role source | `.agents/skills/agent-milestone-orchestrator` |
| Cadence | `.llm/harness/workflow/canary-cadence.md` |

## First-execution obligation

This run is the first real execution of the milestone-orchestrator system (PR #1161). #1163
(milestone 0.0.6) collects observational proof from this run's artifacts alone. Standing order from
the owner brief: **where the skill/profile/cadence is unclear or missing, record the gap as a
finding — do not route around it silently.** Findings accumulate in `drift.md` and `worklog.md`.

## Launch precondition (verified, not relayed)

JSR `meta.json` queried directly 2026-08-03: `@netscript/{cli,service,contracts,sdk,mcp}` all
report `latest: 0.0.4`. Precondition green; run proceeds.

## Role boundary

The orchestrator delegates, verifies, merges, and consolidates. It does not implement framework
code. Implementation routes per `lane-policy.md`; the merge decision is the orchestrator's alone,
through the `milestone-run.md` pre-merge gate. The real stable JSR publish is the owner's call
only.

## PLAN-EVAL decision (owner-decided 2026-08-03; see drift.md D1)

The wave plan gets a separate-session PLAN-EVAL on the **`review_claude` lane: Codex · OpenAI ·
GPT-5.6 Sol · xhigh** — owner-routed, matching the canonical `routing-policy.ts` binding verbatim
(opposite-family review of Claude-authored work, subscription transport). Generator (this Fable
session) ≠ evaluator (Codex session in `/home/codex/repos/ns-005-planeval` on
`eval/0.0.5-wave-plan`); the evaluator's verdict artifact is `plan-eval.md`. First verdict:
**FAIL** (2026-08-03, commit `b8b7475b1`) — all blockers addressed in plan v2, then resubmitted to
the same thread. `phase-registry.md` is not used for this run: waves are tracked in `plan.md` and
`cut-trace.md`, which serve the phase-group role (recorded here per the profile's
"when phase groups apply" clause).

## Coordination notes at run start

- #1151 / #1152 (CI scoping, delegated to `/home/codex/repos/ns-ci-scope`): both already CLOSED
  inside milestone 0.0.5. No coordination remains.
- #1101 (libSQL/Turso docs): CLOSED in 0.0.5. The brief listed it as inherited-open; reality is
  closed. Recorded as a brief/reality delta, not a gap in the system artifacts.
- OMB board: RFC #1123, epic #1126, slices S1–S14 = #1127–#1140. #1139 (S13) gated on F2 — out of
  scope unless owner moves it in. #1140 (S14) observational — routes to #1090, cannot close by PR.
