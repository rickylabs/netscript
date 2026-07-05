# Drift — beta4-cut-A-ai--impl

| Time | Severity | Drift | Action |
| --- | --- | --- | --- |
| 2026-07-05 | minor | PLAN-EVAL default OpenHands path is not directly exposed in this WSL implementation session. | Use a separate local evaluator sub-agent for PLAN-EVAL if available; do not self-certify. |
| 2026-07-05 | minor | Owner prompt requires `.llm/runs/beta4-cut-A-ai--impl/commits.md`, while current harness docs say there is no `commits.md`. | Create and maintain `commits.md` for this run while also using PR comments as canonical trail. |
| 2026-07-05 | minor | `--mcp` scaffold.runtime variant is allowed to be stubbed in beta.4 because MCP pooling dependencies are beta.6. | Land named stub variant and call it out in PR body. |

## 2026-07-05 — AI install variants beyond default

Severity: medium

The AI adapter already exposes the opt-in `thread-store` resource for the `--persist-threads` variant, but the public `plugin install` command does not yet forward plugin-specific install flags and the public plugin verb dispatcher does not expose adapter-owned `add`/`generate` verbs. This slice therefore wires the default AI install into `scaffold.runtime` and records `--persist-threads` as present at the adapter-resource layer but not yet CLI-variant-addressable. The `--mcp` variant remains a beta.6 stub per owner mandate (FAI-7/8 own MCP pooling).
