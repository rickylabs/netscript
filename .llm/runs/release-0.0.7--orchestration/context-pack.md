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

Step 0 is repaired at 64 inspected targets / 60 active issues, 43 leaves, and nine dispatch waves.
#1564 is closed-fixed; there is no implementation wave-zero barrier. The canonical artifacts must
validate green, and the remaining dispatch gate is approval from the bounded PLAN-EVAL re-review.
