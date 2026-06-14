# 2026-06-14 — OpenHands Alternatives Research

Created a harness Research-mode artifact set under `.llm/tmp/run/work--openhands-alternatives-research/` evaluating OpenHands replacements for the NetScript GitHub Actions cloud-agent workflow.

Recommendation: preserve the existing workflow wrapper semantics, route all engines through LiteLLM proxy, pilot OpenCode first, keep mini-swe-agent as fallback/evaluator, and consider VoltAgent for a future TypeScript-native orchestrator.

Limitation: live recent failed/timed-out Actions run inspection could not be completed because `gh` is not installed in the container.
