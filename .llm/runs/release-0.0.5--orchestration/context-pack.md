# Context pack — release-0.0.5--orchestration

Living context for anyone (successor orchestrator, evaluator, owner) entering this run cold.
Updated at stage boundaries; the closing version is written at stage G.

## What this run is

The 0.0.5 milestone driven end-to-end on the milestone-orchestrator system (skill + profile +
cadence, PR #1161) — its **first real execution**; #1163 collects the observational proof from
these artifacts. System gaps are recorded findings (worklog § Findings), never silently patched.

## Current state (2026-08-03)

- Stage A/B complete: milestone read (`research.md`), wave plan v2 (`plan.md`) — 31 PRs / 7
  waves / 4 canary points; #1140 + #1175 moved to 0.0.6 with reasons on the issues.
- PLAN-EVAL v1 verdict: FAIL (`plan-eval.md`, eval branch commit `b8b7475b1`) — all blockers
  resolved in plan v2; resubmitted to the same evaluator thread.
- No wave dispatched yet.

## Read order for a cold start

1. `supervisor.md` — identity, decisions, role boundary.
2. `plan.md` — dispositions, wave table, canary schedule, risks.
3. `worklog.md` — chronological record incl. findings for #1163 and per-dispatch gate records.
4. `drift.md` — recorded deviations and owner decisions.
5. `owner-brief.md` — the binding owner brief (copied from `.llm/tmp/BRIEF-0.0.5.md`).
6. `research.md` — the acceptance-level milestone read the clusters are built on.
7. `cut-trace.md` — the instrumented merge record (live from stage D onward).
8. `slices/` — per-slice briefs and thread ids (`slices/plan-eval/` holds the evaluator's).

## Standing constraints carried from the brief

Every `gh` call passes `--repo rickylabs/netscript`; stable JSR publish is the owner's call only;
never kill by pattern; attached launches through the agentic suite only; expensive gates
serialized; the machine is shared.
