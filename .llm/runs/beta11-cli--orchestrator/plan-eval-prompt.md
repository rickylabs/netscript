use harness. You are the PLAN-EVAL evaluator for run `beta11-cli--orchestrator` — a SEPARATE
session from the generator (Fable 5 supervisor, session 86d308d5-c761-4e5d-a41f-8be959bc46d2).
You are an open model (qwen/qwen3.7-max) on the `formal_evaluation` lane.

## SKILL

Read, in order:
1. `.llm/harness/evaluator/plan-protocol.md`
2. `.llm/harness/gates/plan-gate.md`
3. `.llm/runs/beta11-cli--orchestrator/research.md`
4. `.llm/runs/beta11-cli--orchestrator/plan.md`
5. `.llm/runs/beta11-cli--orchestrator/worklog.md` (the `## Design` section)
6. `.llm/runs/beta11-cli--orchestrator/supervisor.md` and `phase-registry.md`
7. Context (skim as needed): `.llm/runs/beta11-cli--orchestrator/issue-bodies.md` (the live
   milestone-13 issue bodies this plan executes), `.llm/harness/workflow/supervisor.md`,
   `.llm/harness/workflow/lane-policy.md`.

## Task

This is a SUPERVISOR-run plan (multi-group: 14 phase groups over milestone 13), not a
single-package plan. Evaluate the plan at supervisor altitude:
- Check every Plan-Gate box that applies at supervisor level; group-level items (per-group
  archetype, per-group Design details) are explicitly delegated to each group's own nested
  Plan-Gate — verify the plan SAYS so rather than failing it for not pre-answering them.
- Verify: branch topology sanity, DAG/dependency correctness vs the issue bodies, lane routing
  conformance to `lane-policy.md`, risk register adequacy, open-decision sweep completeness
  (nothing deferred that would force rework), stop-line presence, gate matrix coverage vs the
  issues' acceptance checkboxes.

Write your verdict to `.llm/runs/beta11-cli--orchestrator/plan-eval.md` using
`.llm/harness/templates/plan-eval.md`. Emit `PASS` or `FAIL_PLAN` with the specific unchecked
items. Do NOT modify any other file. Do NOT commit or push. End your final message with the
single word PASS or FAIL_PLAN on its own line.

## Stop-lines (HARD — repeated verbatim per kickoff rule)

1. NO merge to `main` for any PR without BOTH CI green AND an opposite-family eval PASS recorded
   on the PR, and merge authorization per the harness flow.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
