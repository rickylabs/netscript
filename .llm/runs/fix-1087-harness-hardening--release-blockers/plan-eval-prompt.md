use harness

You are the separate PLAN-EVAL session for run
`.llm/runs/fix-1087-harness-hardening--release-blockers/`. Evaluate the plan only. Do not implement
or edit product/tooling code.

Read, in order:

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. the run's `research.md`, `plan.md`, and `worklog.md` `## Design`
5. `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
6. `.llm/harness/archetypes/SCOPE-docs.md`
7. `.llm/harness/gates/archetype-gate-matrix.md`
8. `.llm/harness/debt/arch-debt.md` only for relevant entries

Spot-check load-bearing findings against the tree, especially:

- the child-model enforcement boundary and terminal/logged failure design for #1087;
- whether #1084's ownership design proves current-session authorship rather than only unique names;
- whether #1080's negative control literally removes the #1075 adapter fix and proves failure;
- whether #1083's notes-file location is a real release input.

Write the verdict to
`.llm/runs/fix-1087-harness-hardening--release-blockers/plan-eval.md` using the template. Emit exactly
`PASS` or `FAIL_PLAN`. Do not change `deno.lock`, do not launch sub-agents, do not call GitHub, and
do not touch any file outside `plan-eval.md`.

## SKILL

- `.agents/skills/netscript-harness` — enforce the Plan-Gate and separate-session evaluator protocol.
- `.agents/skills/netscript-tools` — use trustworthy read-only evidence and preserve lock hygiene.
- `.agents/skills/netscript-pr` — check that planned close-gate evidence is sufficient.
- `.agents/skills/netscript-release` — validate #1083's notes-file role only.
- `.agents/skills/rtk` — compress read-heavy repository inspection.
