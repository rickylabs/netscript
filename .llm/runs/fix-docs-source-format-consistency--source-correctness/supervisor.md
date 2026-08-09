# Supervisor

- Run: `fix-docs-source-format-consistency--source-correctness`
- Branch: `fix/docs-source-format-consistency`
- Worktree: `/home/codex/repos/ns005-docs-consistency`
- Baseline: `origin/main@3ce91f2c2c6585b736f7267183ab058d6eb3cd69`
- Scope: docs-only source and rendered-output correctness (`SCOPE-docs`)
- Implementation lane: Codex sub-agent, focused docs correctness slice
- Evaluation lane: fresh native opposite-family Claude session, to be launched by the parent supervisor
- PLAN-EVAL: N/A — the defect, source contract, acceptance criteria, and decisive gates are concrete and mechanical.

## SKILL

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.llm/harness/archetypes/SCOPE-docs.md`
