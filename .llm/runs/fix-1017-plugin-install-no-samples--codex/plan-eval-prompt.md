You are the separate formal PLAN-EVAL session for NetScript harness run
`fix-1017-plugin-install-no-samples--codex`. You are an evaluator, not the plan generator.

Read, in order:

1. `.llm/harness/evaluator/plan-protocol.md`
2. `.llm/harness/gates/plan-gate.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/runs/fix-1017-plugin-install-no-samples--codex/research.md`
5. `.llm/runs/fix-1017-plugin-install-no-samples--codex/plan.md`
6. the `## Design` section of `.llm/runs/fix-1017-plugin-install-no-samples--codex/worklog.md`
7. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
8. `.llm/harness/archetypes/ARCHETYPE-5-plugin.md`
9. `.llm/harness/gates/archetype-gate-matrix.md`
10. relevant entries in `.llm/harness/debt/arch-debt.md`

Spot-check load-bearing findings against the current tree, especially the proposed public adapter
policy and the four sample-dependent structural barrels. Do not implement or alter production code.

Fill `.llm/runs/fix-1017-plugin-install-no-samples--codex/plan-eval.md` from the harness template.
Emit exactly `PASS` or `FAIL_PLAN` in its Verdict section with concrete evidence. Your only
filesystem mutation is that evaluator artifact.
