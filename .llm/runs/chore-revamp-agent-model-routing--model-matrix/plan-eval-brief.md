# PLAN-EVAL brief — model routing revamp

Evaluate the committed plan at `5a3e144fe` only. This is a separate architecture-tier evaluator
session using Muse Spark 1.3 at max effort through OpenCode. The owner-authored 2026-09-04 matrix in
`research.md` supersedes the old model examples in the evaluator protocol and lane policy; all other
Plan-Gate procedure and output requirements remain binding.

Read the required inputs in `.llm/harness/evaluator/plan-protocol.md`, walk every checkbox in
`.llm/harness/gates/plan-gate.md`, spot-check at least one load-bearing repository finding, and run
your own open-decision sweep. Judge the plan, not implementation. Do not change production files.

Write the verdict to this run's `plan-eval.md` using the repository template and emit exactly one
`PASS` or `FAIL_PLAN`. If `FAIL_PLAN`, list precise bounded fixes.

## SKILL

- `.agents/skills/netscript-harness/SKILL.md` — mandatory harness and evaluator protocol.
- `.agents/skills/netscript-tools/SKILL.md` — focused repository inspection and evidence rules.
