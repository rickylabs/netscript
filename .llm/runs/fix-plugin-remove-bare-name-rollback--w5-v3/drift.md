# Drift — W5-V3 plugin remove

## D1 — formal evaluator composition

- **Severity:** procedural / authorized.
- **Source:** owner brief; `.llm/harness/workflow/milestone-run.md`; orchestrator ruling D6.
- **Decision:** no duplicate local formal PLAN-EVAL. `plan-eval.md` marks every row COMPOSED and
  implementation proceeds in the same locked run. Independent evaluation composes at
  draft→ready and the milestone pre-merge gate.

## D2 — pre-existing lock modification

- **Severity:** worktree hygiene.
- **Observed:** `deno.lock` was modified before run bootstrap.
- **Decision:** treat as user-owned, exclude from commits, and do not restore or rewrite it.
