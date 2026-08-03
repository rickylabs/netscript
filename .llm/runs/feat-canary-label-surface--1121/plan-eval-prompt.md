use harness

Perform PLAN-EVAL only for run `feat-canary-label-surface--1121` in
`/home/codex/repos/ns004-canary`. You are the separate formal evaluator. Do not implement or edit
product/tooling code. Do not mutate `deno.lock`. Read the required protocol and inputs, spot-check
the load-bearing plan facts, then write only
`.llm/runs/feat-canary-label-surface--1121/plan-eval.md` from the template with exactly `PASS` or
`FAIL_PLAN`. A blank row or silent command is not PASS.

## SKILL

- `.agents/skills/netscript-harness` — enforce the Plan-Gate and separate-session protocol.
- `.agents/skills/netscript-release` — verify the plan consumes publish identity without copying
  publish mechanics.
- `.agents/skills/netscript-tools` — use trustworthy read-only evidence and preserve lock hygiene.
- `.agents/skills/rtk` — compress read-heavy git/grep inspection.

Required reading:

- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/plan-gate.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/runs/feat-canary-label-surface--1121/research.md`
- `.llm/runs/feat-canary-label-surface--1121/plan.md`
- `.llm/runs/feat-canary-label-surface--1121/worklog.md` (`## Design`)
- `.llm/runs/feat-canary-label-surface--1121/drift.md`

Explicitly evaluate whether target-scoped drift, `@netscript/cli` as the coordinated publish marker,
the previous content-point rule, and the external live-cut close-gate handling are sufficiently
locked to implement without rework.
