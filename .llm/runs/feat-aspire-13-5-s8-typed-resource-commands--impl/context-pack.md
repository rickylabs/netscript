# Context pack — S8 #1720

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s8`
- Branch: `feat/aspire-13-5-s8-typed-resource-commands`
- Stack base: S6 `564d465cc6b6af5518f959f3ad53beb422590da1`
- Draft PR base: `feat/aspire-13-5-s6-health-checks`
- Issues: closes #1720 and #863; part of #1712 (never close the epic)
- Locked decision: D-6, `excludeFromMcp()` controls MCP exposure only; never emit `withHidden()`
- Phase-A prohibition: no `aspire start`, AppHost runtime, or containers
- D-19 command prefix: `/home/agent/.local/bin/mise exec --`; restore only
- Known host blocker: first restore exit 134 with `inotify instances ... limit (128)` is recorded
  once and escalated; no retry loop
- Push command: `git push origin HEAD:refs/heads/feat/aspire-13-5-s8-typed-resource-commands`
- Required evaluator: separate Fable 5 IMPL-EVAL; implementation agent cannot certify the result

Primary code surfaces are the db-cli-mode and register-tools generators/templates, Aspire runtime
asset templates, database Aspire command executor/operation runner and their tests, and the CLI
scaffold E2E runtime gate modules. Package/framework boundaries outside `packages/cli` are excluded.
