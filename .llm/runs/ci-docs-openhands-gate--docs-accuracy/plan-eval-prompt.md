use harness

## SKILL

- `netscript-harness` — enforce the formal PLAN-EVAL protocol and hard Plan-Gate.
- `netscript-tools` — verify baseline facts and preserve lock/worktree hygiene.
- `openhands-handoff` — verify open-model routing and the PAT/comment trigger contract without dispatching OpenHands.
- `netscript-pr` — check the planned taxonomy, draft-PR trail, and label semantics.
- `rtk` — keep read-heavy repository inspection compact.

Act only as the separate PLAN-EVAL session for run
`.llm/runs/ci-docs-openhands-gate--docs-accuracy/` in
`/home/codex/repos/b10-docsgate` on branch `ci/docs-openhands-gate`.

Read, in order:

1. `.llm/harness/evaluator/plan-protocol.md`
2. `.llm/harness/gates/plan-gate.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. the run's `research.md`, `plan.md`, and `worklog.md` Design section
5. `.llm/harness/archetypes/SCOPE-docs.md`
6. `.llm/harness/gates/archetype-gate-matrix.md`

Spot-check load-bearing findings against the current tree, including the exact Minimax model id,
the PAT chain-trigger rule, the absence of `doc-audit.md`, and the existing skill sync task. Judge
only the plan. Do not implement, commit, push, comment on GitHub, dispatch OpenHands, or modify any
file except the run's `plan-eval.md`.

Write `.llm/runs/ci-docs-openhands-gate--docs-accuracy/plan-eval.md` using the repository template.
Emit exactly `PASS` or `FAIL_PLAN` and include your session identity and checklist evidence.
