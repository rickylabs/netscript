use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Role

You are the separate formal IMPL-EVAL session for run
`.llm/runs/fix-aspire-lifecycle--958/` on branch `fix/aspire-lifecycle`. Evaluate only; do not
implement, commit, push, contact GitHub, delegate to another model/session, or invoke any closed
model. Read `.llm/harness/evaluator/protocol.md`, its required inputs, and the binding
`# PLAN-EVAL resolution` at the end of `plan.md`.

Inspect commits `38eb35c2e` and `55dd47be5`, the current clean diff against their merge base, run
artifacts, and independently run the smallest useful read-only gates. The generator recorded two
full `scaffold.runtime` runs with 44 passes and one deterministic failure each:
`behavior.service-health` returned database-unhealthy from Prisma `$queryRaw`; cleanup passed.
Do not turn that into a pass. Determine whether it blocks this slice under the evaluator protocol
and state the evidence precisely.

Write only `.llm/runs/fix-aspire-lifecycle--958/evaluate.md` using the evaluator template and an
allowed formal verdict. Every PASS needs evidence. Keep findings scoped to the approved resolution.
