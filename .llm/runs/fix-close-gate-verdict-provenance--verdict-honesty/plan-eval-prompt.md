use harness

# PLAN-EVAL — close-gate verdict honesty (#1171 + #1105)

You are the formal PLAN-EVAL evaluator for NetScript run
`fix-close-gate-verdict-provenance--verdict-honesty`. You are a separate session from the plan
generator. Evaluate the plan only; do not implement code, alter `deno.lock`, or broaden scope.

## SKILL

- `netscript-harness` — enforce the Plan-Gate and evaluator separation.
- `netscript-tools` — use trustworthy repo evidence and preserve lock hygiene.
- `netscript-pr` — assess the planned PR-body convention/template consistency.
- `rtk` — compact read-heavy repository inspection.

## Inputs

Read in this order:

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/research.md`
5. `.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/plan.md`
6. The `## Design` section in the run's `worklog.md`
7. `.llm/harness/gates/archetype-gate-matrix.md`
8. Issues #1171 and #1105 as quoted/summarized in `research.md`; spot-check the load-bearing tree
   claims against current files.

## Required output

Write the verdict of record to
`.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/plan-eval.md` using the template.
Walk every Plan-Gate box, run your own open-decision sweep, and emit exactly `PASS` or `FAIL_PLAN`.
Commit only the verdict artifact (and compact evaluator trace if the harness transport requires it)
to `fix/close-gate-verdict-provenance`. Do not modify implementation files, the plan generator's
artifacts, or `deno.lock`.
