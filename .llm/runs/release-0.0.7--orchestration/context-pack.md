# Context pack — release 0.0.7

Read, in order:

1. `.llm/harness/workflow/milestone-run.md`
2. `.llm/harness/workflow/canary-cadence.md`
3. `.llm/harness/workflow/run-loop.md`
4. `.llm/harness/workflow/lane-policy.md`
5. `.agents/skills/agent-milestone-orchestrator/SKILL.md`
6. This run's `research.md`, `plan.md`, `worklog.md`, `step0-synthesis.md`, the four milestone
   control JSON artifacts, `milestone-leaf-plan.json`, and `leaf-contracts.json`.

Baseline identity is `01e0960494c95ce56eb35892c211a095eb13e6ed`. Treat GitHub live state as
mutable after the snapshot; any issue or `main` drift must be recorded before dispatch or merge.

Step 0 is approved at 64 inspected targets / 60 active issues, 43 leaves, and nine dispatch waves.
#1564 is closed-fixed; there is no implementation wave-zero barrier. PLAN-EVAL cycle 2 approved
dispatch at plan head `331f7c664`; `leaf-contracts.json` is binding input for every leaf.

Reset authority at `2026-08-15T00:00:00+02:00`: `codex-root-0.0.7` remains sole milestone
coordinator, but topic supervision is native Claude only. Preserve and park the four historical
Codex topic threads before attaching one Claude Sonnet 5/low Remote Control supervisor to each
existing topic worktree. Claude supervisors do not implement; WSL Codex Sol leaves use low effort
for mechanical work, medium by default, and high only for demonstrated complexity.

Read `briefs/reset-gates/dispatch.json` after the central state. It supersedes the pre-reset
six-Fable route: every still-required formal gate remains fresh, separate, opposite-family, and
serial, but starts on the least-cost assigned Sonnet route. Fable is escalation-only after concrete
failure evidence and a new recorded coordinator amendment. No paused leaf resumes merely because
the clock reset; its exact head, hold, lease, CI, and formal gate must be re-established first.
