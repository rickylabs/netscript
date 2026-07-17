Review implementation slice 5 for issue #811 in `/home/codex/repos/b10-canary`.

Scope:

- `.agents/skills/netscript-release/SKILL.md` and its generated Claude mirror
- `.llm/harness/debt/arch-debt.md`

Act only as an independent reviewer. Do not edit files, delegate, spawn agents, or run mutating
commands. Check the current working-tree diff against issue #811 and the harness plan. Confirm the
skill makes canary-first publication mandatory; prohibits `release:publish` without a same-content
green canary publish plus canary-pinned `e2e-cli-prod`; documents `<target>-canary.N`,
immutable/yank policy, provenance tag and ephemeral branch behavior, no ad-hoc publishing, exact
#810 sunset, and stable completion gates. Confirm the debt closure is honest without claiming a live
canary.

Return blocking findings with file/section and precise remediation, or end with `SLICE_REVIEW_PASS`
when no blocking issues remain.
