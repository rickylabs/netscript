use harness

## SKILL

- `netscript-harness` — enforce the Plan-Gate and evaluator separation.
- `netscript-tools` — use scoped, read-only repository inspection.
- `rtk` — use repository-standard read-heavy command wrappers where available.

You are the separate local PLAN-EVAL session for run
`chore-qwen-3-8-evaluator--1331`. You are running through OpenRouter as
`minimax/minimax-m3`, the owner-confirmed default for PLAN-EVAL. Do not implement and do not edit
repository files.

Read, in order:

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/runs/chore-qwen-3-8-evaluator--1331/research.md`
5. `.llm/runs/chore-qwen-3-8-evaluator--1331/plan.md`
6. the `## Design` section of `.llm/runs/chore-qwen-3-8-evaluator--1331/worklog.md`
7. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` when applicable
8. `.llm/harness/gates/archetype-gate-matrix.md`
9. relevant entries in `.llm/harness/debt/arch-debt.md`

Spot-check load-bearing findings against the current repository. Pay particular attention to the
phase split: PLAN-EVAL must default to `minimax/minimax-m3`; only IMPL-EVAL migrates to
`qwen/qwen3.8-max`; stale Qwen 3.7 and cross-phase preset use must be rejected. Confirm that the
plan's slices, generated-source ownership, tests, canaries, documentation sync, exact-residue audit,
and rollback boundaries are complete and correctly ordered.

Return a complete `plan-eval.md` body using the repository template and exactly one `PASS` or
`FAIL_PLAN` verdict. Do not modify files: emit the proposed artifact on stdout so the supervisor can
record it verbatim with evaluator session/model evidence.
