# Worklog — chore/epic-574-agentic-default-docs (PR 8)

## 2026-07-10 — Fable 5 doc-alignment subagent (workflow-as-default framing)

- `AGENTS.md`: added "Default Operating Workflow (agentic runtime)" section — lane-policy as routing
  authority, `.llm/tools/agentic/config/` as single volatile source, agentic suite + runtime
  controller (`agentic:runtime doctor|status|repair codex-remote`) as the only lane interface.
- `.llm/harness/workflow/tooling.md`: added the runtime-controller CLI rows to the `agentic:*` task
  table (`agentic:runtime`, `agentic:routing-state`, `agentic:antigravity-evidence`,
  `agentic:provider-canary`, `agentic:rollout-canary`, `agentic:wsl-foundation`) — previously the
  runtime/ lane was named in prose but its tasks were unindexed.
- `.agents/skills/netscript-tools/SKILL.md`: named `agentic:runtime` as the default health/repair
  entry point and `agentic:routing-state` as the quota-fallback state view.
- `.agents/skills/codex-wsl-remote/SKILL.md`: routed daemon repair to
  `agentic:runtime repair codex-remote` first (verified refusal on active sessions in
  `runtime/codex-remote-repair.ts`); demoted the PowerShell helper to manual fallback; pointed
  version literals at `config/versions.ts`.
- Regenerated `.claude/skills/` mirrors via `deno task agentic:sync-claude`.
- Gates: `deno task docs:maintenance` PASS (links 0 broken, sync-claude:check OK, check-claude OK);
  `git diff --check` clean. No `.ts` touched.
- Not changed (already aligned by prior pass): netscript-harness, claude-manager,
  openhands-handoff, lane-policy.md, agentic README.
