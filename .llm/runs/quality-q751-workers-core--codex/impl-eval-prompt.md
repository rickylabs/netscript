# IMPL-EVAL — #751 deeper-elimination re-dispatch

Act as the final separate Anthropic Opus 4.8/high evaluator for harness run
`quality-q751-workers-core--codex` in `/home/codex/repos/ns-q751-workers-core-h`. This must be an
independent IMPL-EVAL, not implementation and not the PLAN-EVAL session.

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/impl-eval.md`, the run's
`plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`, and all three slice-review
artifacts. Evaluate committed HEAD against base `3b3d615b` and the owner contract:

- proper typing eliminates every code-quality finding in `packages/plugin-workers-core`;
- exact scanner with `--max-allow 5` is `ok:true`, preferably 0 allowances;
- no `quality-allow`, `deno-lint-ignore`, `as unknown as`, or `as never` loophole was added;
- boundary types reflect schemas, builder typestate is immutable and enforced, runtime/custom ports
  remain structural, and behavior/export compatibility is reasonable;
- scoped check/lint/fmt, package tests, co-located KV tests, publish dry-run, doc lint, architecture,
  and lock hygiene evidence satisfy the plan;
- doc private-ref debt is not deepened (pre-Slice-3 24, final 13; runtime/registry 0);
- run artifacts truthfully record rejected prior 14 allowances versus final count and explain every
  survivor (there should be none).

Re-run the smallest authoritative probes needed. Do not edit source, commit, push, open a PR, or
change any run artifact other than your evaluator result. Write the full rubric evidence and final
`PASS` or `FAIL` verdict to `.llm/runs/quality-q751-workers-core--codex/evaluate.md`.
