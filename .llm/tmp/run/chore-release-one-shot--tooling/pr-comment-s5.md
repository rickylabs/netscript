**[PHASE: IMPL] [SLICE: S5]**

S5 pushed: D5 adds the `netscript-release` skill, regenerates the Claude mirror, and points `AGENTS.md` release work at the new skill.

- Commit: `e2a6a2f5` (`docs(release): add release workflow skill`)
- Scope: `.agents/skills/netscript-release/SKILL.md`, generated `.claude/skills/netscript-release/SKILL.md`, `AGENTS.md`
- Gate: `deno task agentic:sync-claude` — PASS, generated mirror
- Gate: `deno task agentic:sync-claude:check` — PASS
- Gate: `.llm/tools/agentic/validate-claude-surface.ts --pretty` — PASS
- Gate: `git diff -- deno.lock` — PASS, no lock diff after removing incidental YAML-parser resolution churn
