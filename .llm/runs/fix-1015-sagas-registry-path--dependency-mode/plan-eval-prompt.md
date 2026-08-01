You are the separate PLAN-EVAL session for NetScript harness run
`fix-1015-sagas-registry-path--dependency-mode`. You are an open model on the canonical
`formal_evaluation` route and did not generate the plan.

Work from `/home/codex/repos/fix-1015`. Read and enforce, in order:

1. `.llm/harness/evaluator/plan-protocol.md`
2. `.llm/harness/gates/plan-gate.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/runs/fix-1015-sagas-registry-path--dependency-mode/research.md`
5. `.llm/runs/fix-1015-sagas-registry-path--dependency-mode/plan.md`
6. the `## Design` section of that run's `worklog.md`
7. `.llm/harness/archetypes/ARCHETYPE-5-plugin.md`, `SCOPE-service.md`, the gate matrix, and relevant debt.

Spot-check load-bearing findings against the source tree. Evaluate the plan only; do not modify
product code and do not implement fixes. Write the verdict artifact directly to
`.llm/runs/fix-1015-sagas-registry-path--dependency-mode/plan-eval.md` using the template. Emit
exactly `PASS` or `FAIL_PLAN`, with checklist evidence and specific fixes for any failure.
