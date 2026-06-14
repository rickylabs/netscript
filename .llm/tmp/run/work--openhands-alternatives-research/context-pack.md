# Context Pack — OpenHands Alternatives Research

## Current state

Research-only harness run created for replacing or reducing reliance on OpenHands in the NetScript cloud-agent GitHub Actions workflow.

## Key conclusion

Recommended direction: keep the current GitHub Actions trigger/comment/trace shell, introduce LiteLLM proxy as the mandatory LLM gateway, and pilot OpenCode as the first candidate engine. Keep mini-swe-agent as the reliability fallback and VoltAgent as a future TypeScript orchestrator/observability layer.

## Important constraints

- `gh` is unavailable in this container, so live recent GitHub run failures/timeouts were not inspected.
- No workflow replacement has been implemented yet.
- Existing OpenHands Action has useful infrastructure that should be preserved: trigger parsing, output modes, run-scoped summary paths, partial commit-back, PR/non-PR behavior, and trace artifacts.

## Next actions

1. Install/configure LiteLLM proxy with virtual keys and per-agent budgets.
2. Add a new workflow alongside OpenHands, e.g. `.github/workflows/cloud-agent-opencode.yml`.
3. Copy the request/artifact/comment/commit-back contract from `openhands-agent.yml`.
4. Replace only install/run with OpenCode plus LiteLLM config.
5. Run parallel pilots on small PR review/comment tasks before deprecating OpenHands.
