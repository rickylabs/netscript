## Summary

Explain `netscript agent mcp` when a developer launches it interactively while preserving a byte-clean stdio MCP transport for clients.

## Scope

- Archetype / area: CLI agent/MCP command boundary
- Closes #1248

## Slices

- [x] S0 Issue-first research, locked plan, draft surface — `9dd3e82cd`
- [x] S1 TTY affordance and editor snippets — `bab5eaefc`
- [x] S2 Help/docs and targeted gates — `bab5eaefc`

## Validation

- Focused MCP command/adapters: 4 passed
- CLI package: 597 passed / 484 steps
- Scoped check/lint/fmt and diff hygiene: pass
- Documentation links and accuracy: pass

## Harness

- Run dir: `.llm/runs/fix-agent-mcp-affordance-1248--1248/`
- Route: openai / gpt-5.6-sol / medium
- Phase: implementation evaluation / orchestrator pre-merge gate

## Drift / Debt

- #1247 is not yet on `origin/main`; this PR follows its accepted `none|zed|vscode` contract and emits snippets for the two configurable editors.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1248
entries:
  - box-index: 1
    evidence: "Interactive command regression proves guidance is emitted and server startup is skipped; text explains stdio and copyable setup."
  - box-index: 2
    evidence: "Piped-stdin regression proves zero guidance writes and unchanged server input dispatch; existing real stdio E2E remains green in the CLI package task."
  - box-index: 3
    evidence: "Command help regression asserts the stdio transport and https://netscript.dev/ai/agent-tooling/ link."
  - box-index: 4
    evidence: "Interactive regression asserts native .zed/settings.json context_servers and .vscode/mcp.json servers snippets, aligned with #1247."
```
