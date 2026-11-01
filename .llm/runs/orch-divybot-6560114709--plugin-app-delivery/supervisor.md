# Installed plugin delivery

- Assignment: #2578; feature tier; supplied leaf profile.
- Baseline: `4cb0298` on `orch/divybot-6560114709`.
- Implementation: Codex, OpenAI family, requested xhigh effort.
- Matrix queried with `deno task agentic:matrix --tier feature --json`.
- Owner override: “IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
- Evaluation: separate Claude session, Anthropic family; reuse the session for repairs.
- Public evidence uses repository-relative paths and omits private environment identities.

## Permitted write surface

- `.llm/runs/orch-divybot-6560114709--plugin-app-delivery/**`
- `packages/cli/src/**` (plugin install/doctor, settings, generated scaffold carriers)
- `packages/cli/e2e/**` (runtime overview assertion)
- `packages/aspire/**` (reference contracts and tests)
- `plugins/workers/**` (registry CLI entry point and tests)
- `docs/**` (plugin install and remote Docker guidance)
- `.github/workflows/**` (only if runtime acceptance needs CI wiring)
- `.llm/assets/agent-docs/**`, `packages/mcp/src/**` (required generated carriers)

Expand this list with an explicit drift entry before writing other tracked files.
