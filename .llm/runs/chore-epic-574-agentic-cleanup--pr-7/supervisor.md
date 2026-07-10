# Supervisor: PR 7 — production-grade cleanup of .llm/tools/agentic (owner-directed)

| Field              | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Run ID             | `chore-epic-574-agentic-cleanup--pr-7`                                      |
| Branch             | `chore/epic-574-agentic-cleanup`                                            |
| Worktree           | `/home/codex/repos/netscript-epic-574-cleanup`                              |
| Base (integration) | `rickylabs-epic-574-wsl-agentic-runtime` @ `45b6eb6d` (all six #574 layers) |
| Coordinator        | Claude Opus 4.8 (WSL supervisor)                                            |
| Implementer        | **Fable 5 (high)** — single owner-authorized exceptional cleanup subagent   |

Owner directive (2026-07-10): `.llm/tools/agentic/` is a flat unstructured dump; restructure to
production-grade, eliminate all redundant/stale/draft/dead code (reference-analysis proven), revamp
docs. Standalone PR — safe to be bold; every gate stays green; no live behavior regresses. This is
the last step before integration→main promotion. Design is Fable's; guardrails are fixed.
