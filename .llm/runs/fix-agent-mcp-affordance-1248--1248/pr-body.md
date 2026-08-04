## Summary

Explain `netscript agent mcp` when a developer launches it interactively while preserving a byte-clean stdio MCP transport for clients.

## Scope

- Archetype / area: CLI agent/MCP command boundary
- Closes #1248

## Slices

- [x] S0 Issue-first research, locked plan, draft surface — `9dd3e82cd`
- [ ] S1 TTY affordance and editor snippets
- [ ] S2 Help/docs and targeted gates

## Validation

- Pending implementation.

## Harness

- Run dir: `.llm/runs/fix-agent-mcp-affordance-1248--1248/`
- Route: openai / gpt-5.6-sol / medium
- Phase: implementation

## Drift / Debt

- #1247 is not yet on `origin/main`; this PR follows its accepted `none|zed|vscode` contract and emits snippets for the two configurable editors.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1248
entries:
  - box-index: 1
    evidence: "Pending implementation."
  - box-index: 2
    evidence: "Pending implementation."
  - box-index: 3
    evidence: "Pending implementation."
  - box-index: 4
    evidence: "Pending implementation."
```
