use harness

## SKILL

- `netscript-harness` — enforce the Plan-Gate and evaluator separation.
- `netscript-tools` — use scoped, read-only repository inspection.
- `rtk` — use repository-standard read-heavy command wrappers where available.

You are the separate local PLAN-EVAL session for run
`feat-agentic-remote-model-proxy--split-gateway`. Do not implement or edit product/tooling files.
Read, in order:

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/runs/feat-agentic-remote-model-proxy--split-gateway/research.md`
5. `.llm/runs/feat-agentic-remote-model-proxy--split-gateway/plan.md`
6. the `## Design` section of its `worklog.md`
7. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
8. `.llm/harness/gates/archetype-gate-matrix.md`
9. relevant entries in `.llm/harness/debt/arch-debt.md`

Spot-check load-bearing findings against the repository. Return a complete `plan-eval.md` body
using the repository template and exactly one `PASS` or `FAIL_PLAN` verdict. This is a local-only
evaluation; do not dispatch OpenHands. Do not modify files: emit the proposed artifact on stdout so
the supervising session can record it verbatim with the evaluator session evidence.
