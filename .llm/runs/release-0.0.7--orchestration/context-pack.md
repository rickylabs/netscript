# Context pack — release 0.0.7

Read, in order:

1. `.llm/harness/workflow/milestone-run.md`
2. `.llm/harness/workflow/canary-cadence.md`
3. `.llm/harness/workflow/run-loop.md`
4. `.llm/harness/workflow/lane-policy.md`
5. `.agents/skills/agent-milestone-orchestrator/SKILL.md`
6. This run's `research.md`, `plan.md`, `worklog.md`, `step0-synthesis.md`, the four milestone
   control JSON artifacts, and `milestone-leaf-plan.json`.

Baseline identity is `01e0960494c95ce56eb35892c211a095eb13e6ed`. Treat GitHub live state as
mutable after the snapshot; any issue or `main` drift must be recorded before dispatch or merge.

Step 0 is frozen at 64 targets / 61 active issues, 44 leaves, and 10 dispatch waves. #1564 is the
sole wave-0 merge barrier. The canonical artifacts validate green; the remaining dispatch gate is
the one composed PLAN-EVAL.
