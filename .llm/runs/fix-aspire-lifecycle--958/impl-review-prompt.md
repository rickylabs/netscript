use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools

## Role

Act as the independent opposite-family adversarial reviewer for the uncommitted implementation on
branch `fix/aspire-lifecycle`. Do not edit files, commit, push, or contact GitHub.

Read the binding `# PLAN-EVAL resolution` at the end of
`.llm/runs/fix-aspire-lifecycle--958/plan.md`, then inspect the current `git diff` and new files for
issues #958 and #970. Pay special attention to:

- preservation of non-isolated persistent-container behavior;
- the generated TypeScript `--isolated` signal bridge and timeout default;
- correctness and lifecycle safety of the generated stderr runner and Aspire notification code;
- generated asset/manifest/pipeline completeness;
- regression tests and the documented verified drift.

Report only actionable findings, ordered by severity, with file and line references. If there are
no actionable findings, state `PASS` and briefly name the highest-risk contracts you verified.
